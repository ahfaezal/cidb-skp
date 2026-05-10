from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import SessionLocal
from models import CMCS
from schemas import CMCSCreate, CMCSUpdate, CMCSResponse

router = APIRouter(
    prefix="/cmcs",
    tags=["CMCS"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=List[CMCSResponse])
def get_all_cmcs(db: Session = Depends(get_db)):
    return db.query(CMCS).order_by(CMCS.id.desc()).all()


@router.get("/{cmcs_id}", response_model=CMCSResponse)
def get_cmcs(cmcs_id: int, db: Session = Depends(get_db)):
    item = db.query(CMCS).filter(CMCS.id == cmcs_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="CMCS not found")

    return item


@router.post("/", response_model=CMCSResponse)
def create_cmcs(data: CMCSCreate, db: Session = Depends(get_db)):
    new_item = CMCS(**data.model_dump())

    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return new_item


@router.put("/{cmcs_id}", response_model=CMCSResponse)
def update_cmcs(cmcs_id: int, data: CMCSUpdate, db: Session = Depends(get_db)):
    item = db.query(CMCS).filter(CMCS.id == cmcs_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="CMCS not found")

    update_data = data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)

    return item


@router.delete("/{cmcs_id}")
def delete_cmcs(cmcs_id: int, db: Session = Depends(get_db)):
    item = db.query(CMCS).filter(CMCS.id == cmcs_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="CMCS not found")

    db.delete(item)
    db.commit()

    return {"message": "CMCS deleted successfully"}