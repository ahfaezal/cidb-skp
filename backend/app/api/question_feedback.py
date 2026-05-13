import json
from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.question_feedback import QuestionFeedback
from app.models.user import User
from app.services.auth_service import get_current_user

router = APIRouter(
    prefix="/question-feedback",
    tags=["Question Feedback"],
)


class QuestionFeedbackCreate(BaseModel):
    responses: Dict[str, str] = Field(default_factory=dict)


class QuestionFeedbackResponse(BaseModel):
    id: int
    ownerRef: str
    ownerName: str
    ownerRole: str
    projectRef: str
    responses: Dict[str, str]
    createdAt: str


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def feedback_to_response(feedback: QuestionFeedback):
    return QuestionFeedbackResponse(
        id=feedback.id,
        ownerRef=feedback.owner_ref,
        ownerName=feedback.owner_name,
        ownerRole=feedback.owner_role,
        projectRef=feedback.project_ref,
        responses=json.loads(feedback.responses_json),
        createdAt=feedback.created_at.isoformat() if feedback.created_at else "",
    )


@router.post("/", response_model=QuestionFeedbackResponse)
def create_question_feedback(
    data: QuestionFeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not data.responses:
        raise HTTPException(status_code=422, detail="Maklum balas tidak boleh kosong.")

    feedback = QuestionFeedback(
        owner_ref=str(current_user.id),
        owner_name=current_user.name,
        owner_role=current_user.role,
        project_ref=current_user.project_ref,
        responses_json=json.dumps(data.responses, ensure_ascii=False),
    )

    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    return feedback_to_response(feedback)


@router.get("/", response_model=List[QuestionFeedbackResponse])
def get_question_feedback(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "Super Admin":
        raise HTTPException(status_code=403, detail="Akses feedback hanya untuk Super Admin.")

    feedback_items = (
        db.query(QuestionFeedback)
        .order_by(QuestionFeedback.created_at.desc(), QuestionFeedback.id.desc())
        .all()
    )

    return [feedback_to_response(feedback) for feedback in feedback_items]
