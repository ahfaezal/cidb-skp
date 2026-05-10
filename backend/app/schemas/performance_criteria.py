from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PerformanceCriteriaBase(BaseModel):
    work_activity_id: int
    criteria: str


class PerformanceCriteriaCreate(PerformanceCriteriaBase):
    pass


class PerformanceCriteriaUpdate(BaseModel):
    criteria: Optional[str] = None


class PerformanceCriteriaResponse(PerformanceCriteriaBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True