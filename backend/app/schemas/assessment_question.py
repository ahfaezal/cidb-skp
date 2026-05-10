from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AssessmentQuestionBase(BaseModel):
    package_id: int
    question_type: str = "Subjective"
    question_text: str
    answer_scheme: Optional[str] = None
    rubric: Optional[str] = None
    marks: int = 1
    status: str = "Draft"


class AssessmentQuestionCreate(AssessmentQuestionBase):
    pass


class AssessmentQuestionUpdate(BaseModel):
    question_type: Optional[str] = None
    question_text: Optional[str] = None
    answer_scheme: Optional[str] = None
    rubric: Optional[str] = None
    marks: Optional[int] = None
    status: Optional[str] = None


class AssessmentQuestionResponse(AssessmentQuestionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
