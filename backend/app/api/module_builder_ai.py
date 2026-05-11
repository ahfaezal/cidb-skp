import os
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.api.trade_cmcs_mappings import extract_response_text

router = APIRouter(
    prefix="/module-builder-ai",
    tags=["Module Builder AI"],
)


class ModuleBuilderAIRequest(BaseModel):
    action: str
    trade_title: Optional[str] = None
    competency_code: Optional[str] = None
    competency_title: Optional[str] = None
    group_title: Optional[str] = None
    group_subtitle: Optional[str] = None
    mapping_context: str = ""
    current_content: str = ""
    selected_text: str = ""


class ModuleBuilderAIResponse(BaseModel):
    content: str


def build_prompt(data: ModuleBuilderAIRequest):
    selected = data.selected_text.strip() or data.current_content.strip()
    action_guides = {
        "Jana AI": (
            "Generate a complete Malay learning package draft using the required SKP format: "
            "Tajuk, Objektif, Penerangan, numbered content sections, Rujukan, Latihan, Skema Jawapan."
        ),
        "Tambah Huraian": (
            "Expand the selected paragraph into a clearer, richer teaching explanation in Malay. "
            "Keep it practical for facilitators and trainees."
        ),
        "Jana Gambar": (
            "Create an image generation brief in Malay and English. Include subject, scene, labels, "
            "style, composition, and what the image must teach. Return as a module insert block."
        ),
        "Carta": (
            "Create a clear chart/table-style content block in Markdown. Include title, columns, rows, "
            "and short explanation."
        ),
        "Jadual": (
            "Create a practical Markdown table for the selected topic. Include columns suitable for "
            "training, inspection, documents, risks, controls, and evidence."
        ),
        "Proses Flow": (
            "Create a process flow using Mermaid flowchart syntax plus a short explanation in Malay."
        ),
        "Rujukan": (
            "Generate credible reference categories and document examples for this module. Avoid fake "
            "publication details. Use practical Malaysian construction/rail context where relevant."
        ),
        "Latihan": (
            "Generate exercises and answer scheme for trainees. Include objective questions, scenario "
            "tasks, and marking guide."
        ),
    }

    guide = action_guides.get(data.action, action_guides["Tambah Huraian"])

    return f"""
You are assisting SKP-CIDB module development for Malaysian competency-based training.
Write in Malay unless a short English image prompt is requested.

Action:
{data.action}

Instruction:
{guide}

Trade:
{data.trade_title or "-"}

Competency:
{data.competency_code or "-"} - {data.competency_title or "-"}

Selected module/group:
{data.group_title or "-"}
{data.group_subtitle or "-"}

Mapping context:
{data.mapping_context}

Selected/current text to work on:
{selected or "-"}

Return only the content to insert into the module editor. Do not wrap in JSON.
"""


@router.post("/generate", response_model=ModuleBuilderAIResponse)
async def generate_module_builder_content(data: ModuleBuilderAIRequest):
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="OPENAI_API_KEY is not configured for this backend.",
        )

    payload = {
        "model": os.getenv("OPENAI_MODEL", "gpt-5.2"),
        "input": build_prompt(data),
    }

    try:
        async with httpx.AsyncClient(timeout=90) as client:
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

    content = extract_response_text(response.json()).strip()

    if not content:
        raise HTTPException(status_code=502, detail="AI returned empty content.")

    return ModuleBuilderAIResponse(content=content)
