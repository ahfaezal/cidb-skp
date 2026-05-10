from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CMCSBase(BaseModel):
    title: str
    description: Optional[str] = None
    level: Optional[str] = None
    sector: Optional[str] = None

class CMCSCreate(CMCSBase):
    pass

class CMCSUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    level: Optional[str] = None
    sector: Optional[str] = None

class CMCSResponse(CMCSBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True