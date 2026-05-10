from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class TradeBase(BaseModel):
    code: str
    title: str
    description: Optional[str] = None
    sector: Optional[str] = None
    category_code: Optional[str] = None
    category_name: Optional[str] = None
    field_title: Optional[str] = None
    facilitator_name: Optional[str] = None
    custom_category: Optional[str] = None
    custom_field_title: Optional[str] = None
    status: str = "Active"
    workflow_status: str = "Mapping Process"


class TradeCreate(TradeBase):
    pass


class TradeUpdate(BaseModel):
    code: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    sector: Optional[str] = None
    category_code: Optional[str] = None
    category_name: Optional[str] = None
    field_title: Optional[str] = None
    facilitator_name: Optional[str] = None
    custom_category: Optional[str] = None
    custom_field_title: Optional[str] = None
    status: Optional[str] = None
    workflow_status: Optional[str] = None


class TradeResponse(TradeBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
