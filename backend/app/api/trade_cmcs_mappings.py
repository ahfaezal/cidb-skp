import json
import os
from typing import List

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.cmcs import CMCS
from app.models.competency_unit import CompetencyUnit
from app.models.trade import Trade
from app.models.trade_cmcs_mapping import TradeCMCSMapping
from app.schemas.trade_cmcs_mapping import (
    TradeCMCSMappingAIDraftRequest,
    TradeCMCSMappingAIDraftResponse,
    TradeCMCSMappingCreate,
    TradeCMCSMappingResponse,
    TradeCMCSMappingUpdate,
)

router = APIRouter(
    prefix="/trade-cmcs-mappings",
    tags=["Trade CMCS Mappings"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def to_response(mapping: TradeCMCSMapping, db: Session):
    cmcs = db.query(CMCS).filter(CMCS.id == mapping.cmcs_id).first()
    unit = None

    if mapping.competency_unit_id:
        unit = (
            db.query(CompetencyUnit)
            .filter(CompetencyUnit.id == mapping.competency_unit_id)
            .first()
        )

    return {
        **mapping.__dict__,
        "cmcs_title": cmcs.title if cmcs else None,
        "competency_unit_code": unit.code if unit else None,
        "competency_unit_title": unit.title if unit else None,
    }


def extract_response_text(data: dict):
    if data.get("output_text"):
        return data["output_text"]

    chunks = []
    for item in data.get("output", []):
        for content in item.get("content", []):
            if content.get("type") in {"output_text", "text"} and content.get("text"):
                chunks.append(content["text"])

    return "\n".join(chunks)


def get_required_item(model, item_id: int, label: str, db: Session):
    item = db.query(model).filter(model.id == item_id).first()

    if not item:
        raise HTTPException(status_code=404, detail=f"{label} not found")

    return item


@router.get("/trade/{trade_id}", response_model=List[TradeCMCSMappingResponse])
def get_mappings_by_trade(trade_id: int, db: Session = Depends(get_db)):
    mappings = (
        db.query(TradeCMCSMapping)
        .filter(TradeCMCSMapping.trade_id == trade_id)
        .order_by(TradeCMCSMapping.id.asc())
        .all()
    )

    return [to_response(mapping, db) for mapping in mappings]


@router.post("/ai-draft", response_model=TradeCMCSMappingAIDraftResponse)
async def generate_ai_mapping_draft(
    data: TradeCMCSMappingAIDraftRequest,
    db: Session = Depends(get_db),
):
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="OPENAI_API_KEY is not configured for this backend.",
        )

    trade = get_required_item(Trade, data.trade_id, "Trade", db)
    cmcs = get_required_item(CMCS, data.cmcs_id, "CMCS", db)
    unit = None

    if data.competency_unit_id:
        unit = get_required_item(
            CompetencyUnit,
            data.competency_unit_id,
            "Competency unit",
            db,
        )

    prompt = f"""
Generate a concise, practical SKP-CIDB CMCS-to-trade mapping draft in Malay.

Trade:
- Code: {trade.code}
- Title: {trade.title}
- Category: {trade.category_name or trade.custom_category or trade.sector or "-"}
- Field: {trade.field_title or trade.custom_field_title or "-"}
- Scope: {trade.description or "-"}

CMCS:
- Code: {cmcs.code or f"CMCS-{cmcs.id}"}
- Title: {cmcs.title}
- Description: {cmcs.description or "-"}

Competency Unit:
- {unit.code if unit else "All"} {unit.title if unit else "Semua Competency Unit"}

Return only valid JSON with these keys:
trade_specific_content, draft_module_title, draft_objective,
draft_content_outline, suggested_learning_packages,
suggested_assessment_areas, mapping_notes, blocks.

Guidelines:
- Write for Malaysian CIDB SKP module development.
- Make the content specific to the selected trade, not generic.
- blocks must be an array of 5 to 8 objects.
- Each blocks object must have:
  - title: short module content heading, maximum 12 words.
  - subtitle: narrower scope or teaching focus, maximum 16 words.
  - items: 3 to 6 bullet points as plain strings.
- blocks is the primary output used by the UI. Do not put the whole paragraph into title.
- draft_content_outline must be structured as 5 to 8 numbered content blocks.
- Each numbered block must start with a short title only.
- After each numbered title, include one line beginning exactly with "Sub Tajuk:".
- Under each Sub Tajuk, include 3 to 6 bullet lines using "- " for sub-sub topics or key teaching points.
- Example format:
  1. Pengenalan
  Sub Tajuk: Skop dan konteks kerja
  - Isi penting pertama
  - Isi penting kedua
- suggested_learning_packages should contain 2 to 4 PL lines.
- suggested_assessment_areas should contain bullet lines.
- mapping_notes should explain the mapping rationale briefly.
"""

    payload = {
        "model": os.getenv("OPENAI_MODEL", "gpt-5.2"),
        "input": prompt,
        "text": {"format": {"type": "json_object"}},
    }

    try:
        async with httpx.AsyncClient(timeout=60) as client:
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
        raise HTTPException(
            status_code=502,
            detail=exc.response.text,
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail="AI generation request failed.",
        ) from exc

    output_text = extract_response_text(response.json())

    try:
        draft = json.loads(output_text)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=502,
            detail="AI response was not valid JSON.",
        ) from exc

    return TradeCMCSMappingAIDraftResponse(**draft)


@router.post("/", response_model=TradeCMCSMappingResponse)
def create_mapping(data: TradeCMCSMappingCreate, db: Session = Depends(get_db)):
    existing_mapping = (
        db.query(TradeCMCSMapping)
        .filter(
            TradeCMCSMapping.trade_id == data.trade_id,
            TradeCMCSMapping.cmcs_id == data.cmcs_id,
            TradeCMCSMapping.competency_unit_id == data.competency_unit_id,
        )
        .first()
    )

    if existing_mapping:
        raise HTTPException(status_code=400, detail="Mapping already exists")

    mapping = TradeCMCSMapping(**data.model_dump())

    db.add(mapping)
    db.commit()
    db.refresh(mapping)

    return to_response(mapping, db)


@router.put("/{mapping_id}", response_model=TradeCMCSMappingResponse)
def update_mapping(
    mapping_id: int,
    data: TradeCMCSMappingUpdate,
    db: Session = Depends(get_db),
):
    mapping = (
        db.query(TradeCMCSMapping).filter(TradeCMCSMapping.id == mapping_id).first()
    )

    if not mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(mapping, key, value)

    db.commit()
    db.refresh(mapping)

    return to_response(mapping, db)


@router.delete("/{mapping_id}")
def delete_mapping(mapping_id: int, db: Session = Depends(get_db)):
    mapping = (
        db.query(TradeCMCSMapping).filter(TradeCMCSMapping.id == mapping_id).first()
    )

    if not mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")

    db.delete(mapping)
    db.commit()

    return {"message": "Mapping deleted successfully"}
