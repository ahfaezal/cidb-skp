from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CMCSBase(BaseModel):
    code: Optional[str] = None
    title: str
    description: Optional[str] = None
    level: Optional[str] = None
    sector: Optional[str] = None


class CMCSCreate(CMCSBase):
    pass


class CMCSUpdate(BaseModel):
    code: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    level: Optional[str] = None
    sector: Optional[str] = None


class CMCSResponse(CMCSBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
