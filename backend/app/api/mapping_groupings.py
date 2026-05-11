import json
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.learning_package import LearningPackage
from app.models.mapping_grouping import MappingGrouping
from app.models.module_content_block import ModuleContentBlock
from app.models.skp_module import SKPModule
from app.schemas.mapping_grouping import (
    MappingGroupingCreate,
    MappingGroupingResponse,
    MappingGroupingUpdate,
)

router = APIRouter(
    prefix="/mapping-groupings",
    tags=["Mapping Groupings"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _trim_text(value: Optional[str], max_length: int) -> Optional[str]:
    if value is None:
        return None

    cleaned = value.strip()
    if len(cleaned) <= max_length:
        return cleaned

    return cleaned[: max_length - 1].rstrip() + "..."


def _normalize_grouping_payload(data: dict) -> dict:
    normalized = data.copy()
    normalized["source_code"] = _trim_text(normalized.get("source_code"), 50)
    normalized["source_title"] = _trim_text(normalized.get("source_title"), 255)
    normalized["module_title"] = _trim_text(normalized.get("module_title"), 255)
    normalized["status"] = _trim_text(normalized.get("status"), 50) or "Saved"
    return normalized


@router.get("/trade/{trade_id}", response_model=List[MappingGroupingResponse])
def get_groupings_by_trade(trade_id: int, db: Session = Depends(get_db)):
    return (
        db.query(MappingGrouping)
        .filter(MappingGrouping.trade_id == trade_id)
        .order_by(MappingGrouping.id.asc())
        .all()
    )


@router.post("/", response_model=MappingGroupingResponse)
def create_grouping(data: MappingGroupingCreate, db: Session = Depends(get_db)):
    grouping = MappingGrouping(**_normalize_grouping_payload(data.model_dump()))

    db.add(grouping)
    db.commit()
    db.refresh(grouping)

    return grouping


@router.put("/{grouping_id}", response_model=MappingGroupingResponse)
def update_grouping(
    grouping_id: int,
    data: MappingGroupingUpdate,
    db: Session = Depends(get_db),
):
    grouping = db.query(MappingGrouping).filter(MappingGrouping.id == grouping_id).first()

    if not grouping:
        raise HTTPException(status_code=404, detail="Mapping grouping not found")

    updates = _normalize_grouping_payload(data.model_dump(exclude_unset=True))

    for key, value in updates.items():
        setattr(grouping, key, value)

    db.commit()
    db.refresh(grouping)

    return grouping


@router.delete("/{grouping_id}")
def delete_grouping(grouping_id: int, db: Session = Depends(get_db)):
    grouping = db.query(MappingGrouping).filter(MappingGrouping.id == grouping_id).first()

    if not grouping:
        raise HTTPException(status_code=404, detail="Mapping grouping not found")

    db.delete(grouping)
    db.commit()

    return {"message": "Mapping grouping deleted successfully"}


@router.post("/{grouping_id}/send-to-module-builder", response_model=MappingGroupingResponse)
def send_grouping_to_module_builder(grouping_id: int, db: Session = Depends(get_db)):
    grouping = db.query(MappingGrouping).filter(MappingGrouping.id == grouping_id).first()

    if not grouping:
        raise HTTPException(status_code=404, detail="Mapping grouping not found")

    try:
        groups = json.loads(grouping.groups_json)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Saved grouping JSON is invalid") from exc

    module = None
    if grouping.module_id:
        module = db.query(SKPModule).filter(SKPModule.id == grouping.module_id).first()

    if not module:
        module_count = (
            db.query(SKPModule).filter(SKPModule.trade_id == grouping.trade_id).count()
        )
        module = SKPModule(
            trade_id=grouping.trade_id,
            competency_id=None,
            code=f"M{module_count + 1:02d}",
            title=grouping.module_title,
            objective=grouping.module_objective,
            description=f"Generated from {grouping.source_code} mapping grouping.",
            status="Draft",
        )
        db.add(module)
        db.flush()

    for group_index, group in enumerate(groups, start=1):
        package = LearningPackage(
            module_id=module.id,
            code=f"PL{group_index:02d}",
            title=group.get("title") or f"Learning Package {group_index}",
            objective=group.get("subtitle"),
            description=f"Generated from {grouping.source_code} grouping.",
            content_outline=json.dumps(group, ensure_ascii=False),
            status="Draft",
        )
        db.add(package)
        db.flush()

        db.add(
            ModuleContentBlock(
                module_id=module.id,
                package_id=package.id,
                block_type="lp_title",
                title=package.title,
                content=package.title,
                metadata_json=json.dumps(group, ensure_ascii=False),
                sort_order=1,
                ai_generated=True,
                review_status="Draft",
            )
        )

        db.add(
            ModuleContentBlock(
                module_id=module.id,
                package_id=package.id,
                block_type="objective",
                title="Objektif",
                content=package.objective,
                metadata_json=json.dumps(group, ensure_ascii=False),
                sort_order=2,
                ai_generated=True,
                review_status="Draft",
            )
        )

        for block_index, block in enumerate(group.get("blocks", []), start=1):
            db.add(
                ModuleContentBlock(
                    module_id=module.id,
                    package_id=package.id,
                    block_type="section",
                    title=block.get("title"),
                    content="\n".join(block.get("items", [])),
                    metadata_json=json.dumps(block, ensure_ascii=False),
                    sort_order=block_index + 2,
                    ai_generated=True,
                    review_status="Draft",
                )
            )

    grouping.module_id = module.id
    grouping.status = "Sent to Module Builder"
    db.commit()
    db.refresh(grouping)

    return grouping
