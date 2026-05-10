from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class WorkActivityBase(BaseModel):
    competency_unit_id: int
    code: Optional[str] = None
    title: str
    description: Optional[str] = None


class WorkActivityCreate(WorkActivityBase):
    pass


class WorkActivityUpdate(BaseModel):
    code: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None


class WorkActivityResponse(WorkActivityBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True