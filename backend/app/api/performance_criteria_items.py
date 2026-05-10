from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import SessionLocal
from app.models.performance_criteria_item import PerformanceCriteriaItem
from app.schemas.performance_criteria_item import (
    PerformanceCriteriaItemCreate,
    PerformanceCriteriaItemUpdate,
    PerformanceCriteriaItemResponse,
)

router = APIRouter(
    prefix="/performance-criteria-items",
    tags=["Performance Criteria Items"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/{criteria_id}", response_model=List[PerformanceCriteriaItemResponse])
def get_items_by_criteria(criteria_id: int, db: Session = Depends(get_db)):
    return (
        db.query(PerformanceCriteriaItem)
        .filter(PerformanceCriteriaItem.performance_criteria_id == criteria_id)
        .order_by(PerformanceCriteriaItem.id.asc())
        .all()
    )


@router.get("/criteria/{criteria_id}", response_model=List[PerformanceCriteriaItemResponse])
def get_items_by_criteria_alt(criteria_id: int, db: Session = Depends(get_db)):
    return (
        db.query(PerformanceCriteriaItem)
        .filter(PerformanceCriteriaItem.performance_criteria_id == criteria_id)
        .order_by(PerformanceCriteriaItem.id.asc())
        .all()
    )


@router.post("/", response_model=PerformanceCriteriaItemResponse)
def create_item(data: PerformanceCriteriaItemCreate, db: Session = Depends(get_db)):
    new_item = PerformanceCriteriaItem(**data.model_dump())

    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return new_item


@router.put("/{item_id}", response_model=PerformanceCriteriaItemResponse)
def update_item(
    item_id: int,
    data: PerformanceCriteriaItemUpdate,
    db: Session = Depends(get_db)
):
    item = (
        db.query(PerformanceCriteriaItem)
        .filter(PerformanceCriteriaItem.id == item_id)
        .first()
    )

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    update_data = data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)

    return item


@router.delete("/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db)):
    item = (
        db.query(PerformanceCriteriaItem)
        .filter(PerformanceCriteriaItem.id == item_id)
        .first()
    )

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    db.delete(item)
    db.commit()

    return {"message": "Item deleted successfully"}