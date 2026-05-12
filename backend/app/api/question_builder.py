import base64
import json
import os
import re
import zipfile
from io import BytesIO
from typing import List, Optional
from xml.etree import ElementTree

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.question_builder_draft import QuestionBuilderDraft
from app.models.user import User
from app.api.trade_cmcs_mappings import extract_response_text
from app.services.auth_service import get_current_user
from app.services.s3_storage import upload_question_file

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


class QuestionBuilderDraftCreate(BaseModel):
    title: str = "Draf Soalan"
    ownerRef: str = "local-user"
    ownerName: str = "Pengguna"
    ownerRole: str = "Fasilitator"
    projectRef: str = "General"
    visibility: str = "Private"
    status: str = "Draft"
    settings: dict
    files: List[dict] = Field(default_factory=list)
    questions: List[dict]
    analysis: dict = Field(default_factory=dict)


class QuestionBuilderDraftResponse(BaseModel):
    id: int
    title: str
    ownerRef: str
    ownerName: str
    ownerRole: str
    projectRef: str
    visibility: str
    status: str
    settings: dict
    files: List[dict]
    questions: List[dict]
    analysis: dict
    createdAt: str
    updatedAt: str


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def normalize_settings(settings: QuestionBuilderSettings):
    if "Objektif" not in settings.questionTypes:
        settings.objectiveCount = 0

    if "Subjektif" not in settings.questionTypes:
        settings.subjectiveCount = 0

    return settings


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


async def build_file_content(files: List[UploadFile], owner_ref: str):
    content = []
    file_records = []

    for upload in files:
        file_bytes = await upload.read()
        filename = upload.filename or "nota"
        extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

        if extension not in {"txt", "docx", "pdf"}:
            raise HTTPException(
                status_code=415,
                detail="Hanya fail PDF, DOCX dan TXT disokong.",
            )

        storage = upload_question_file(
            file_bytes=file_bytes,
            filename=filename,
            content_type=upload.content_type or "application/octet-stream",
            owner_ref=owner_ref,
        )
        file_records.append(
            {
                "id": f"{filename}-{len(file_bytes)}",
                "name": filename,
                "size": len(file_bytes),
                "type": upload.content_type or extension.upper() or "FILE",
                "storage": storage,
            }
        )

        if extension == "txt":
            text = file_bytes.decode("utf-8", errors="ignore").strip()
            content.append(
                {
                    "type": "input_text",
                    "text": f"Kandungan nota rujukan:\n\n{text}",
                }
            )
            continue

        if extension == "docx":
            text = extract_docx_text(file_bytes)
            content.append(
                {
                    "type": "input_text",
                    "text": f"Kandungan nota rujukan DOCX:\n\n{text}",
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

    return content, file_records


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


def build_prompt(settings: QuestionBuilderSettings):
    total_questions = 0
    if "Objektif" in settings.questionTypes:
        total_questions += settings.objectiveCount
    if "Subjektif" in settings.questionTypes:
        total_questions += settings.subjectiveCount

    return f"""
Anda ialah pembina soalan AI untuk platform SKP-CIDB.
Tulis dalam Bahasa Melayu profesional.
Gunakan kandungan fail nota yang dilampirkan sebagai sumber utama. Jangan jana soalan template atau soalan umum yang tidak berpaut kepada nota.
Jangan sebut nama fail, nombor fail, "Nota PL", atau rujukan kepada fail upload dalam teks soalan, pilihan jawapan, skema, rasional, rubrik atau topik analisis.

7 input pengguna yang wajib digunakan:
1. Kandungan nota yang dimuat naik oleh pengguna
2. Jenis soalan: {", ".join(settings.questionTypes)}
3. Jumlah soalan: Objektif {settings.objectiveCount}, Subjektif {settings.subjectiveCount}, keseluruhan {total_questions}
4. Keterampilan soalan: {", ".join(settings.skillCategories)}
5. Aras soalan: {", ".join(settings.difficultyLevels)}
6. Jana skema jawapan: {"Ya" if settings.generateAnswerScheme else "Tidak"}
7. Jana rubrik jawapan: {"Ya" if settings.generateRubric else "Tidak"}

Definisi aras soalan berasaskan Bloom Taxonomy:
- Aras Rendah merangkumi Pengetahuan dan Kefahaman. Soalan mesti menilai ingatan semula, istilah, fakta, turutan kerja, maksud, prinsip asas, kefahaman proses, atau keupayaan menjelaskan/menghuraikan perkara asas daripada nota.
- Aras Sederhana merangkumi Aplikasi. Soalan mesti meminta peserta menggunakan prinsip dalam situasi kerja, memilih tindakan, melakukan langkah, menyelesaikan tugasan praktikal, membina dokumen ringkas, atau menentukan penggunaan prosedur berdasarkan konteks nota.
- Aras Tinggi merangkumi Analisis, Sintesis dan Penilaian. Soalan mesti meminta peserta memisah dan mengkategori maklumat, menganalisis punca/risiko, mengesan isu, menggabungkan beberapa elemen, merumus strategi, menilai pilihan, mencadangkan tindakan, mengkritik keputusan, atau mempertahankan justifikasi.

Peraturan aras:
- Jika Aras Rendah dipilih, jangan jadikan soalan terlalu analitikal atau berbentuk cadangan strategi.
- Jika Aras Sederhana dipilih, soalan perlu ada konteks aplikasi kerja, bukan sekadar definisi.
- Jika Aras Tinggi dipilih, soalan perlu memerlukan pertimbangan, analisis, sintesis atau penilaian; jangan jana soalan hafalan mudah.
- Gunakan kata kerja yang sepadan dengan aras. Contoh Rendah: nyatakan, kenal pasti, terangkan, susun. Contoh Sederhana: gunakan, pilih, tunjukkan, laksanakan, bina. Contoh Tinggi: analisis, bandingkan, rumuskan, cadangkan, nilai, kritik, justifikasikan.
- Pastikan difficulty setiap soalan benar-benar selari dengan definisi aras, bukan sekadar label.

Peraturan wajib:
- Jana tepat mengikut jumlah soalan yang diminta untuk jenis yang dipilih.
- Jika jenis soalan tidak dipilih, jangan jana soalan jenis tersebut walaupun nilai count wujud dalam tetapan.
- Jumlah questions array mesti tepat {total_questions}. Jangan lebih dan jangan kurang.
- Setiap soalan mesti mempunyai satu skillCategory daripada keterampilan yang dipilih sahaja.
- Setiap soalan mesti mempunyai satu difficulty daripada aras yang dipilih sahaja.
- Soalan objektif mesti ada 4 pilihan A-D, correctAnswer, rationale ringkas dan answerScheme jika diminta.
- Pilihan jawapan objektif mesti disusun daripada teks paling pendek kepada paling panjang. Label A-D mesti ikut susunan baharu dan correctAnswer mesti merujuk label baharu yang betul.
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


def enforce_generation_settings(result: dict, settings: QuestionBuilderSettings):
    questions = result.get("questions")

    if not isinstance(questions, list):
        result["questions"] = []
        return result

    allowed_types = set(settings.questionTypes)
    allowed_skills = set(settings.skillCategories)
    allowed_levels = set(settings.difficultyLevels)
    target_counts = {
        "Objektif": settings.objectiveCount,
        "Subjektif": settings.subjectiveCount,
    }
    seen_counts = {"Objektif": 0, "Subjektif": 0}
    filtered = []

    for question in questions:
        if not isinstance(question, dict):
            continue

        question_type = question.get("type")
        skill_category = question.get("skillCategory")
        difficulty = question.get("difficulty")

        if question_type not in allowed_types:
            continue
        if skill_category not in allowed_skills:
            continue
        if difficulty not in allowed_levels:
            continue
        if seen_counts[question_type] >= target_counts[question_type]:
            continue

        seen_counts[question_type] += 1
        question["id"] = f"q{len(filtered) + 1}"
        filtered.append(question)

    result["questions"] = filtered

    if "analysis" not in result or not isinstance(result["analysis"], dict):
        result["analysis"] = {}

    result["analysis"]["skillDistribution"] = {
        skill: round(
            sum(1 for question in filtered if question.get("skillCategory") == skill)
            / max(1, len(filtered))
            * 100
        )
        for skill in settings.skillCategories
    }
    result["analysis"]["difficultyDistribution"] = {
        level: round(
            sum(1 for question in filtered if question.get("difficulty") == level)
            / max(1, len(filtered))
            * 100
        )
        for level in settings.difficultyLevels
    }

    return result


@router.post("/generate")
async def generate_questions(
    settings: str = Form(...),
    ownerRef: str = Form("local-user"),
    files: Optional[List[UploadFile]] = File(None),
    current_user: User = Depends(get_current_user),
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

    parsed_settings = normalize_settings(parsed_settings)
    try:
        file_content, file_records = await build_file_content(files, str(current_user.id))
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail="Fail nota gagal disimpan ke S3. Semak AWS key, bucket dan permission.",
        ) from exc
    prompt = build_prompt(parsed_settings)

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
        result = json.loads(output_text)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=502,
            detail="AI response was not valid JSON.",
        ) from exc

    result = enforce_generation_settings(result, parsed_settings)
    result["files"] = file_records
    return result


def draft_to_response(draft: QuestionBuilderDraft):
    return QuestionBuilderDraftResponse(
        id=draft.id,
        title=draft.title,
        ownerRef=draft.owner_ref,
        ownerName=draft.owner_name,
        ownerRole=draft.owner_role,
        projectRef=draft.project_ref,
        visibility=draft.visibility,
        status=draft.status,
        settings=json.loads(draft.settings_json),
        files=json.loads(draft.files_json),
        questions=json.loads(draft.questions_json),
        analysis=json.loads(draft.analysis_json),
        createdAt=draft.created_at.isoformat() if draft.created_at else "",
        updatedAt=draft.updated_at.isoformat() if draft.updated_at else "",
    )


@router.get("/drafts", response_model=List[QuestionBuilderDraftResponse])
def get_question_builder_drafts(
    ownerRef: str = "local-user",
    ownerRole: str = "Fasilitator",
    projectRef: str = "General",
    scope: str = "mine",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(QuestionBuilderDraft)

    if scope == "all" and current_user.role == "Super Admin":
        pass
    elif scope == "project":
        query = query.filter(QuestionBuilderDraft.project_ref == current_user.project_ref)
    else:
        query = query.filter(QuestionBuilderDraft.owner_ref == str(current_user.id))

    drafts = query.order_by(
        QuestionBuilderDraft.updated_at.desc(),
        QuestionBuilderDraft.id.desc(),
    ).all()

    return [draft_to_response(draft) for draft in drafts]


@router.get("/drafts/{draft_id}", response_model=QuestionBuilderDraftResponse)
def get_question_builder_draft(
    draft_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    draft = (
        db.query(QuestionBuilderDraft)
        .filter(QuestionBuilderDraft.id == draft_id)
        .first()
    )

    if not draft:
        raise HTTPException(status_code=404, detail="Draf soalan tidak ditemui.")

    can_view = (
        current_user.role == "Super Admin"
        or draft.owner_ref == str(current_user.id)
        or draft.project_ref == current_user.project_ref
    )
    if not can_view:
        raise HTTPException(status_code=403, detail="Akses draf tidak dibenarkan.")

    return draft_to_response(draft)


@router.post("/drafts")
def save_question_builder_draft(
    data: QuestionBuilderDraftCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not data.questions:
        raise HTTPException(status_code=422, detail="Tiada soalan untuk disimpan.")

    draft = QuestionBuilderDraft(
        title=data.title.strip() or "Draf Soalan",
        owner_ref=str(current_user.id),
        owner_name=current_user.name,
        owner_role=current_user.role,
        project_ref=current_user.project_ref,
        visibility=data.visibility.strip() or "Private",
        status=data.status,
        settings_json=json.dumps(data.settings, ensure_ascii=False),
        files_json=json.dumps(data.files, ensure_ascii=False),
        questions_json=json.dumps(data.questions, ensure_ascii=False),
        analysis_json=json.dumps(data.analysis, ensure_ascii=False),
    )

    db.add(draft)
    db.commit()
    db.refresh(draft)

    return {
        "id": draft.id,
        "title": draft.title,
        "status": draft.status,
        "message": "Draf soalan berjaya disimpan.",
    }
