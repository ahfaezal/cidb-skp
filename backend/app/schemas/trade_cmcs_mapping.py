from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class TradeCMCSMappingBase(BaseModel):
    trade_id: int
    cmcs_id: int
    competency_unit_id: Optional[int] = None
    mapping_notes: Optional[str] = None
    trade_specific_content: Optional[str] = None
    draft_module_title: Optional[str] = None
    draft_objective: Optional[str] = None
    draft_content_outline: Optional[str] = None
    suggested_learning_packages: Optional[str] = None
    suggested_assessment_areas: Optional[str] = None
    relevance_level: str = "Medium"


class TradeCMCSMappingCreate(TradeCMCSMappingBase):
    pass


class TradeCMCSMappingUpdate(BaseModel):
    competency_unit_id: Optional[int] = None
    mapping_notes: Optional[str] = None
    trade_specific_content: Optional[str] = None
    draft_module_title: Optional[str] = None
    draft_objective: Optional[str] = None
    draft_content_outline: Optional[str] = None
    suggested_learning_packages: Optional[str] = None
    suggested_assessment_areas: Optional[str] = None
    relevance_level: Optional[str] = None


class TradeCMCSMappingAIDraftRequest(BaseModel):
    trade_id: int
    cmcs_id: Optional[int] = None
    competency_unit_id: Optional[int] = None
    is_additional: bool = False


class TradeCMCSMappingAIDraftBlock(BaseModel):
    title: str
    subtitle: str
    items: List[str]


class TradeCMCSMappingAIDraftResponse(BaseModel):
    trade_specific_content: str
    draft_module_title: str
    draft_objective: str
    draft_content_outline: str
    suggested_learning_packages: str
    suggested_assessment_areas: str
    mapping_notes: str
    blocks: Optional[List[TradeCMCSMappingAIDraftBlock]] = None


class TradeCMCSMappingResponse(TradeCMCSMappingBase):
    id: int
    created_at: datetime
    cmcs_title: Optional[str] = None
    competency_unit_code: Optional[str] = None
    competency_unit_title: Optional[str] = None

    class Config:
        from_attributes = True
