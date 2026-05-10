from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SKPModuleBase(BaseModel):
    trade_id: int
    competency_id: Optional[int] = None
    code: str
    title: str
    objective: Optional[str] = None
    description: Optional[str] = None
    status: str = "Draft"


class SKPModuleCreate(SKPModuleBase):
    pass


class SKPModuleUpdate(BaseModel):
    competency_id: Optional[int] = None
    code: Optional[str] = None
    title: Optional[str] = None
    objective: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class SKPModuleResponse(SKPModuleBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
