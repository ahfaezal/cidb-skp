from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import SessionLocal
from app.models.performance_criteria import PerformanceCriteria
from app.schemas.performance_criteria import (
    PerformanceCriteriaCreate,
    PerformanceCriteriaUpdate,
    PerformanceCriteriaResponse,
)

router = APIRouter(
    prefix="/performance-criteria",
    tags=["Performance Criteria"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/activity/{activity_id}", response_model=List[PerformanceCriteriaResponse])
def get_criteria_by_activity(activity_id: int, db: Session = Depends(get_db)):
    return (
        db.query(PerformanceCriteria)
        .filter(PerformanceCriteria.work_activity_id == activity_id)
        .order_by(PerformanceCriteria.id.asc())
        .all()
    )


@router.post("/", response_model=PerformanceCriteriaResponse)
def create_criteria(data: PerformanceCriteriaCreate, db: Session = Depends(get_db)):
    new_item = PerformanceCriteria(**data.model_dump())

    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return new_item


@router.put("/{criteria_id}", response_model=PerformanceCriteriaResponse)
def update_criteria(
    criteria_id: int,
    data: PerformanceCriteriaUpdate,
    db: Session = Depends(get_db)
):
    item = (
        db.query(PerformanceCriteria)
        .filter(PerformanceCriteria.id == criteria_id)
        .first()
    )

    if not item:
        raise HTTPException(status_code=404, detail="Performance Criteria not found")

    update_data = data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)

    return item


@router.delete("/{criteria_id}")
def delete_criteria(criteria_id: int, db: Session = Depends(get_db)):
    item = (
        db.query(PerformanceCriteria)
        .filter(PerformanceCriteria.id == criteria_id)
        .first()
    )

    if not item:
        raise HTTPException(status_code=404, detail="Performance Criteria not found")

    db.delete(item)
    db.commit()

    return {"message": "Performance Criteria deleted successfully"}