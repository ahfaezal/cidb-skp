from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func

from app.db.database import Base


class PerformanceCriteriaItem(Base):
    __tablename__ = "performance_criteria_items"

    id = Column(Integer, primary_key=True, index=True)

    performance_criteria_id = Column(
        Integer,
        ForeignKey("performance_criteria.id", ondelete="CASCADE"),
        nullable=False
    )

    type = Column(String(50), nullable=False)

    content = Column(Text, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )