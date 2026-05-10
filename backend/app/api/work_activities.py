from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import SessionLocal
from app.models.work_activity import WorkActivity
from app.schemas.work_activity import (
    WorkActivityCreate,
    WorkActivityUpdate,
    WorkActivityResponse,
)

router = APIRouter(
    prefix="/work-activities",
    tags=["Work Activities"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/unit/{unit_id}", response_model=List[WorkActivityResponse])
def get_work_activities_by_unit(unit_id: int, db: Session = Depends(get_db)):
    return (
        db.query(WorkActivity)
        .filter(WorkActivity.competency_unit_id == unit_id)
        .order_by(WorkActivity.id.asc())
        .all()
    )


@router.post("/", response_model=WorkActivityResponse)
def create_work_activity(data: WorkActivityCreate, db: Session = Depends(get_db)):
    new_item = WorkActivity(**data.model_dump())

    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return new_item


@router.put("/{activity_id}", response_model=WorkActivityResponse)
def update_work_activity(
    activity_id: int,
    data: WorkActivityUpdate,
    db: Session = Depends(get_db)
):
    item = db.query(WorkActivity).filter(WorkActivity.id == activity_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Work Activity not found")

    update_data = data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)

    return item


@router.delete("/{activity_id}")
def delete_work_activity(activity_id: int, db: Session = Depends(get_db)):
    item = db.query(WorkActivity).filter(WorkActivity.id == activity_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Work Activity not found")

    db.delete(item)
    db.commit()

    return {"message": "Work Activity deleted successfully"}