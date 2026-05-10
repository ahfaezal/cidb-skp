from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.assessment_question import AssessmentQuestion
from app.schemas.assessment_question import (
    AssessmentQuestionCreate,
    AssessmentQuestionResponse,
    AssessmentQuestionUpdate,
)

router = APIRouter(
    prefix="/assessment-questions",
    tags=["Assessment Questions"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/package/{package_id}", response_model=List[AssessmentQuestionResponse])
def get_questions_by_package(package_id: int, db: Session = Depends(get_db)):
    return (
        db.query(AssessmentQuestion)
        .filter(AssessmentQuestion.package_id == package_id)
        .order_by(AssessmentQuestion.id.asc())
        .all()
    )


@router.post("/", response_model=AssessmentQuestionResponse)
def create_question(data: AssessmentQuestionCreate, db: Session = Depends(get_db)):
    question = AssessmentQuestion(**data.model_dump())

    db.add(question)
    db.commit()
    db.refresh(question)

    return question


@router.put("/{question_id}", response_model=AssessmentQuestionResponse)
def update_question(
    question_id: int,
    data: AssessmentQuestionUpdate,
    db: Session = Depends(get_db),
):
    question = (
        db.query(AssessmentQuestion)
        .filter(AssessmentQuestion.id == question_id)
        .first()
    )

    if not question:
        raise HTTPException(status_code=404, detail="Assessment question not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(question, key, value)

    db.commit()
    db.refresh(question)

    return question


@router.delete("/{question_id}")
def delete_question(question_id: int, db: Session = Depends(get_db)):
    question = (
        db.query(AssessmentQuestion)
        .filter(AssessmentQuestion.id == question_id)
        .first()
    )

    if not question:
        raise HTTPException(status_code=404, detail="Assessment question not found")

    db.delete(question)
    db.commit()

    return {"message": "Assessment question deleted successfully"}
