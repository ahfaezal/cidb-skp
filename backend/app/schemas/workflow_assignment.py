from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class WorkflowAssignmentBase(BaseModel):
    trade_id: int
    workflow_stage: str
    role: str
    assignee_name: str
    assignee_email: Optional[str] = None
    task_title: str
    notes: Optional[str] = None
    due_date: Optional[date] = None
    status: str = "Assigned"


class WorkflowAssignmentCreate(WorkflowAssignmentBase):
    pass


class WorkflowAssignmentUpdate(BaseModel):
    workflow_stage: Optional[str] = None
    role: Optional[str] = None
    assignee_name: Optional[str] = None
    assignee_email: Optional[str] = None
    task_title: Optional[str] = None
    notes: Optional[str] = None
    due_date: Optional[date] = None
    status: Optional[str] = None


class WorkflowAssignmentResponse(WorkflowAssignmentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
