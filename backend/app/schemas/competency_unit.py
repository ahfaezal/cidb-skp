from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CompetencyUnitBase(BaseModel):
    cmcs_id: int
    code: Optional[str] = None
    title: str
    description: Optional[str] = None


class CompetencyUnitCreate(CompetencyUnitBase):
    pass


class CompetencyUnitUpdate(BaseModel):
    code: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None


class CompetencyUnitResponse(CompetencyUnitBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True