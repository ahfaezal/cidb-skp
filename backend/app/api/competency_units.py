from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import SessionLocal
from app.models.competency_unit import CompetencyUnit
from app.schemas.competency_unit import (
    CompetencyUnitCreate,
    CompetencyUnitUpdate,
    CompetencyUnitResponse,
)

router = APIRouter(
    prefix="/competency-units",
    tags=["Competency Units"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/cmcs/{cmcs_id}", response_model=List[CompetencyUnitResponse])
def get_units_by_cmcs(cmcs_id: int, db: Session = Depends(get_db)):
    return (
        db.query(CompetencyUnit)
        .filter(CompetencyUnit.cmcs_id == cmcs_id)
        .order_by(CompetencyUnit.id.asc())
        .all()
    )


@router.post("/", response_model=CompetencyUnitResponse)
def create_unit(data: CompetencyUnitCreate, db: Session = Depends(get_db)):
    new_unit = CompetencyUnit(**data.model_dump())

    db.add(new_unit)
    db.commit()
    db.refresh(new_unit)

    return new_unit


@router.put("/{unit_id}", response_model=CompetencyUnitResponse)
def update_unit(unit_id: int, data: CompetencyUnitUpdate, db: Session = Depends(get_db)):
    unit = db.query(CompetencyUnit).filter(CompetencyUnit.id == unit_id).first()

    if not unit:
        raise HTTPException(status_code=404, detail="Competency Unit not found")

    update_data = data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(unit, key, value)

    db.commit()
    db.refresh(unit)

    return unit


@router.delete("/{unit_id}")
def delete_unit(unit_id: int, db: Session = Depends(get_db)):
    unit = db.query(CompetencyUnit).filter(CompetencyUnit.id == unit_id).first()

    if not unit:
        raise HTTPException(status_code=404, detail="Competency Unit not found")

    db.delete(unit)
    db.commit()

    return {"message": "Competency Unit deleted successfully"}