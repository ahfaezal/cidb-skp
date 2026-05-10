from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ReviewRecordBase(BaseModel):
    trade_id: int
    workflow_stage: str
    target_type: str
    target_id: Optional[int] = None
    reviewer_name: str
    decision: str = "Revise"
    comments: Optional[str] = None
    status: str = "Open"


class ReviewRecordCreate(ReviewRecordBase):
    pass


class ReviewRecordUpdate(BaseModel):
    workflow_stage: Optional[str] = None
    target_type: Optional[str] = None
    target_id: Optional[int] = None
    reviewer_name: Optional[str] = None
    decision: Optional[str] = None
    comments: Optional[str] = None
    status: Optional[str] = None


class ReviewRecordResponse(ReviewRecordBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
