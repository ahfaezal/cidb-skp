from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.cmcs import CMCS
from app.models.competency_unit import CompetencyUnit
from app.models.trade_cmcs_mapping import TradeCMCSMapping
from app.schemas.trade_cmcs_mapping import (
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


@router.get("/trade/{trade_id}", response_model=List[TradeCMCSMappingResponse])
def get_mappings_by_trade(trade_id: int, db: Session = Depends(get_db)):
    mappings = (
        db.query(TradeCMCSMapping)
        .filter(TradeCMCSMapping.trade_id == trade_id)
        .order_by(TradeCMCSMapping.id.asc())
        .all()
    )

    return [to_response(mapping, db) for mapping in mappings]


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
