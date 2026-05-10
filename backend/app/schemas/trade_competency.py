from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class TradeCompetencyBase(BaseModel):
    trade_id: int
    mapping_id: Optional[int] = None
    code: Optional[str] = None
    title: str
    description: Optional[str] = None
    source_notes: Optional[str] = None
    status: str = "Draft"


class TradeCompetencyCreate(TradeCompetencyBase):
    pass


class TradeCompetencyUpdate(BaseModel):
    mapping_id: Optional[int] = None
    code: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    source_notes: Optional[str] = None
    status: Optional[str] = None


class TradeCompetencyResponse(TradeCompetencyBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
