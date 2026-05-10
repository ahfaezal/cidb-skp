from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from app.db.database import Base


class ReviewRecord(Base):
    __tablename__ = "review_records"

    id = Column(Integer, primary_key=True, index=True)
    trade_id = Column(Integer, ForeignKey("trades.id", ondelete="CASCADE"), nullable=False)
    workflow_stage = Column(String(100), nullable=False)
    target_type = Column(String(100), nullable=False)
    target_id = Column(Integer, nullable=True)
    reviewer_name = Column(String(255), nullable=False)
    decision = Column(String(50), nullable=False, default="Revise")
    comments = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="Open")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
