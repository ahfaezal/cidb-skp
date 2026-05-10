from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.review_record import ReviewRecord
from app.schemas.review_record import (
    ReviewRecordCreate,
    ReviewRecordResponse,
    ReviewRecordUpdate,
)

router = APIRouter(
    prefix="/review-records",
    tags=["Review Records"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/trade/{trade_id}", response_model=List[ReviewRecordResponse])
def get_reviews_by_trade(trade_id: int, db: Session = Depends(get_db)):
    return (
        db.query(ReviewRecord)
        .filter(ReviewRecord.trade_id == trade_id)
        .order_by(ReviewRecord.id.asc())
        .all()
    )


@router.post("/", response_model=ReviewRecordResponse)
def create_review(data: ReviewRecordCreate, db: Session = Depends(get_db)):
    review = ReviewRecord(**data.model_dump())

    db.add(review)
    db.commit()
    db.refresh(review)

    return review


@router.put("/{review_id}", response_model=ReviewRecordResponse)
def update_review(
    review_id: int,
    data: ReviewRecordUpdate,
    db: Session = Depends(get_db),
):
    review = db.query(ReviewRecord).filter(ReviewRecord.id == review_id).first()

    if not review:
        raise HTTPException(status_code=404, detail="Review record not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(review, key, value)

    db.commit()
    db.refresh(review)

    return review


@router.delete("/{review_id}")
def delete_review(review_id: int, db: Session = Depends(get_db)):
    review = db.query(ReviewRecord).filter(ReviewRecord.id == review_id).first()

    if not review:
        raise HTTPException(status_code=404, detail="Review record not found")

    db.delete(review)
    db.commit()

    return {"message": "Review record deleted successfully"}
