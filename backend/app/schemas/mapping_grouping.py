from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class MappingGroupingBase(BaseModel):
    trade_id: int
    cmcs_id: Optional[int] = None
    source_code: str
    source_title: str
    module_title: str
    module_objective: Optional[str] = None
    groups_json: str
    status: str = "Saved"
    module_id: Optional[int] = None


class MappingGroupingCreate(MappingGroupingBase):
    pass


class MappingGroupingUpdate(BaseModel):
    source_code: Optional[str] = None
    source_title: Optional[str] = None
    module_title: Optional[str] = None
    module_objective: Optional[str] = None
    groups_json: Optional[str] = None
    status: Optional[str] = None
    module_id: Optional[int] = None


class MappingGroupingResponse(MappingGroupingBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
