from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func

from app.db.database import Base


class WorkActivity(Base):
    __tablename__ = "work_activities"

    id = Column(Integer, primary_key=True, index=True)
    competency_unit_id = Column(
        Integer,
        ForeignKey("competency_units.id", ondelete="CASCADE"),
        nullable=False
    )

    code = Column(String(50), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())