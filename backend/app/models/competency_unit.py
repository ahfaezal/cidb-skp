from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.database import Base


class CompetencyUnit(Base):
    __tablename__ = "competency_units"

    id = Column(Integer, primary_key=True, index=True)
    cmcs_id = Column(Integer, ForeignKey("cmcs.id", ondelete="CASCADE"), nullable=False)

    code = Column(String(50), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())