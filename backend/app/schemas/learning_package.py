from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class LearningPackageBase(BaseModel):
    module_id: int
    code: str
    title: str
    objective: Optional[str] = None
    description: Optional[str] = None
    content_outline: Optional[str] = None
    references: Optional[str] = None
    exercises: Optional[str] = None
    answer_scheme: Optional[str] = None
    status: str = "Draft"


class LearningPackageCreate(LearningPackageBase):
    pass


class LearningPackageUpdate(BaseModel):
    code: Optional[str] = None
    title: Optional[str] = None
    objective: Optional[str] = None
    description: Optional[str] = None
    content_outline: Optional[str] = None
    references: Optional[str] = None
    exercises: Optional[str] = None
    answer_scheme: Optional[str] = None
    status: Optional[str] = None


class LearningPackageResponse(LearningPackageBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
