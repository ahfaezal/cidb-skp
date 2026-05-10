from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime
from sqlalchemy.sql import func

from app.db.database import Base


class PerformanceCriteria(Base):
    __tablename__ = "performance_criteria"

    id = Column(Integer, primary_key=True, index=True)

    work_activity_id = Column(
        Integer,
        ForeignKey("work_activities.id", ondelete="CASCADE"),
        nullable=False
    )

    criteria = Column(Text, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())