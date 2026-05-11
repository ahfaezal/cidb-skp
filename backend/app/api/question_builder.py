import base64
import json
import os
import re
import zipfile
from io import BytesIO
from typing import List, Optional
from xml.etree import ElementTree

import httpx
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.api.trade_cmcs_mappings import extract_response_text

router = APIRouter(
    prefix="/question-builder",
    tags=["Question Builder"],
)

REQUIRED_SKILL_CATEGORIES = {
    "Prosedur",
    "Fakta / Teori",
    "Sikap / Keselamatan / Persekitaran",
}
REQUIRED_DIFFICULTY_LEVELS = {
    "Aras Rendah",
    "Aras Sederhana",
    "Aras Tinggi",
}


class QuestionBuilderSettings(BaseModel):
    files: List[dict] = Field(default_factory=list)
    questionTypes: List[str]
    objectiveCount: int = 0
    subjectiveCount: int = 0
    skillCategories: List[str]
    difficultyLevels: List[str]
    generateAnswerScheme: bool = True
    generateRubric: bool = True


def clean_json_text(value: str):
    cleaned = value.strip()
    cleaned = re.sub(r"^```(?:json)?", "", cleaned, flags=re.I).strip()
    cleaned = re.sub(r"```$", "", cleaned).strip()
    return cleaned


def extract_docx_text(file_bytes: bytes):
    try:
        with zipfile.ZipFile(BytesIO(file_bytes)) as archive:
            xml_bytes = archive.read("word/document.xml")
    except Exception as exc:
        raise HTTPException(status_code=422, detail="DOCX file could not be read.") from exc

    root = ElementTree.fromstring(xml_bytes)
    namespace = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    paragraphs = []

    for paragraph in root.findall(".//w:p", namespace):
        texts = [
            node.text or ""
            for node in paragraph.findall(".//w:t", namespace)
            if node.text
        ]
        if texts:
            paragraphs.append("".join(texts))

    return "\n".join(paragraphs).strip()


async def build_file_content(files: List[UploadFile]):
    content = []
    file_names = []

    for upload in files:
        file_bytes = await upload.read()
        filename = upload.filename or "nota"
        extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        file_names.append(filename)

        if extension == "txt":
            text = file_bytes.decode("utf-8", errors="ignore").strip()
            content.append(
                {
                    "type": "input_text",
                    "text": f"Fail nota: {filename}\n\n{text}",
                }
            )
            continue

        if extension == "docx":
            text = extract_docx_text(file_bytes)
            content.append(
                {
                    "type": "input_text",
                    "text": f"Fail nota DOCX: {filename}\n\n{text}",
                }
            )
            continue

        if extension == "pdf":
            encoded_pdf = base64.b64encode(file_bytes).decode("utf-8")
            content.append(
                {
                    "type": "input_file",
                    "filename": filename,
                    "file_data": f"data:application/pdf;base64,{encoded_pdf}",
                }
            )
            continue

        raise HTTPException(
            status_code=415,
            detail="Hanya fail PDF, DOCX dan TXT disokong.",
        )

    return content, file_names


def validate_settings(settings: QuestionBuilderSettings):
    if not settings.questionTypes:
        raise HTTPException(status_code=422, detail="Pilih jenis soalan.")

    invalid_types = [
        value for value in settings.questionTypes if value not in {"Objektif", "Subjektif"}
    ]
    if invalid_types:
        raise HTTPException(status_code=422, detail="Jenis soalan tidak sah.")

    if not settings.skillCategories:
        raise HTTPException(status_code=422, detail="Pilih keterampilan soalan.")

    invalid_skills = [
        value
        for value in settings.skillCategories
        if value not in REQUIRED_SKILL_CATEGORIES
    ]
    if invalid_skills:
        raise HTTPException(status_code=422, detail="Keterampilan soalan tidak sah.")

    if not settings.difficultyLevels:
        raise HTTPException(status_code=422, detail="Pilih aras soalan.")

    invalid_levels = [
        value for value in settings.difficultyLevels if value not in REQUIRED_DIFFICULTY_LEVELS
    ]
    if invalid_levels:
        raise HTTPException(status_code=422, detail="Aras soalan tidak sah.")


def build_prompt(settings: QuestionBuilderSettings, file_names: List[str]):
    total_questions = 0
    if "Objektif" in settings.questionTypes:
        total_questions += settings.objectiveCount
    if "Subjektif" in settings.questionTypes:
        total_questions += settings.subjectiveCount

    return f"""
Anda ialah pembina soalan AI untuk platform SKP-CIDB.
Tulis dalam Bahasa Melayu profesional.
Gunakan kandungan fail nota yang dilampirkan sebagai sumber utama. Jangan jana soalan template atau soalan umum yang tidak berpaut kepada nota.

7 input pengguna yang wajib digunakan:
1. Fail nota: {", ".join(file_names)}
2. Jenis soalan: {", ".join(settings.questionTypes)}
3. Jumlah soalan: Objektif {settings.objectiveCount}, Subjektif {settings.subjectiveCount}, keseluruhan {total_questions}
4. Keterampilan soalan: {", ".join(settings.skillCategories)}
5. Aras soalan: {", ".join(settings.difficultyLevels)}
6. Jana skema jawapan: {"Ya" if settings.generateAnswerScheme else "Tidak"}
7. Jana rubrik jawapan: {"Ya" if settings.generateRubric else "Tidak"}

Peraturan wajib:
- Jana tepat mengikut jumlah soalan yang diminta untuk jenis yang dipilih.
- Setiap soalan mesti mempunyai satu skillCategory daripada keterampilan yang dipilih sahaja.
- Setiap soalan mesti mempunyai satu difficulty daripada aras yang dipilih sahaja.
- Soalan objektif mesti ada 4 pilihan A-D, correctAnswer, rationale ringkas dan answerScheme jika diminta.
- Soalan subjektif mesti ada answerScheme dalam bentuk poin utama jika diminta.
- Rubrik hanya untuk soalan subjektif dan wajib disediakan jika generateRubric ialah Ya.
- Jika nota tidak cukup untuk menjana soalan berkualiti, pulangkan JSON dengan questions kosong dan analysis.detectedTopics yang menerangkan isu tersebut.

Pulangkan JSON sah sahaja, tanpa Markdown, dalam format:
{{
  "questions": [
    {{
      "id": "q1",
      "type": "Objektif",
      "difficulty": "Aras Rendah",
      "skillCategory": "Prosedur",
      "question": "Teks soalan",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctAnswer": "A",
      "answerScheme": ["Poin skema"],
      "rubric": [
        {{"criteria": "Kriteria", "marks": 5, "description": "Deskripsi ringkas"}}
      ],
      "rationale": "Rasional ringkas"
    }}
  ],
  "analysis": {{
    "detectedTopics": ["Topik daripada nota"],
    "skillDistribution": {{"Prosedur": 100}},
    "difficultyDistribution": {{"Aras Rendah": 100}}
  }}
}}
"""


@router.post("/generate")
async def generate_questions(
    settings: str = Form(...),
    files: Optional[List[UploadFile]] = File(None),
):
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="OPENAI_API_KEY is not configured for this backend.",
        )

    try:
        parsed_settings = QuestionBuilderSettings(**json.loads(settings))
    except Exception as exc:
        raise HTTPException(status_code=422, detail="Tetapan soalan tidak sah.") from exc

    validate_settings(parsed_settings)

    if not files:
        raise HTTPException(
            status_code=422,
            detail="Sila upload sekurang-kurangnya satu fail nota.",
        )

    file_content, file_names = await build_file_content(files)
    prompt = build_prompt(parsed_settings, file_names)

    payload = {
        "model": os.getenv("OPENAI_MODEL", "gpt-5.2"),
        "input": [
            {
                "role": "user",
                "content": [
                    *file_content,
                    {"type": "input_text", "text": prompt},
                ],
            }
        ],
        "text": {"format": {"type": "json_object"}},
    }

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                "https://api.openai.com/v1/responses",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail=exc.response.text) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="AI generation request failed.") from exc

    output_text = clean_json_text(extract_response_text(response.json()))

    try:
        return json.loads(output_text)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=502,
            detail="AI response was not valid JSON.",
        ) from exc
