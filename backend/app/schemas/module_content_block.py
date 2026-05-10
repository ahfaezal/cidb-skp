from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ModuleContentBlockBase(BaseModel):
    module_id: Optional[int] = None
    package_id: Optional[int] = None
    block_type: str = "paragraph"
    title: Optional[str] = None
    content: Optional[str] = None
    metadata_json: Optional[str] = None
    sort_order: int = 0
    ai_generated: bool = False
    review_status: str = "Draft"


class ModuleContentBlockCreate(ModuleContentBlockBase):
    pass


class ModuleContentBlockUpdate(BaseModel):
    module_id: Optional[int] = None
    package_id: Optional[int] = None
    block_type: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None
    metadata_json: Optional[str] = None
    sort_order: Optional[int] = None
    ai_generated: Optional[bool] = None
    review_status: Optional[str] = None


class ModuleContentBlockResponse(ModuleContentBlockBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
