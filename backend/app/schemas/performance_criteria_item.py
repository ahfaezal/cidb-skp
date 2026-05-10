from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PerformanceCriteriaItemBase(BaseModel):
    performance_criteria_id: int
    type: str
    content: str


class PerformanceCriteriaItemCreate(
    PerformanceCriteriaItemBase
):
    pass


class PerformanceCriteriaItemUpdate(BaseModel):
    type: Optional[str] = None
    content: Optional[str] = None


class PerformanceCriteriaItemResponse(
    PerformanceCriteriaItemBase
):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True