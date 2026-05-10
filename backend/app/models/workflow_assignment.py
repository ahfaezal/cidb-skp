from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from app.db.database import Base


class WorkflowAssignment(Base):
    __tablename__ = "workflow_assignments"

    id = Column(Integer, primary_key=True, index=True)
    trade_id = Column(Integer, ForeignKey("trades.id", ondelete="CASCADE"), nullable=False)
    workflow_stage = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False)
    assignee_name = Column(String(255), nullable=False)
    assignee_email = Column(String(255), nullable=True)
    task_title = Column(String(255), nullable=False)
    notes = Column(Text, nullable=True)
    due_date = Column(Date, nullable=True)
    status = Column(String(50), nullable=False, default="Assigned")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
