from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from app.db.database import Base


class SKPModule(Base):
    __tablename__ = "skp_modules"

    id = Column(Integer, primary_key=True, index=True)
    trade_id = Column(Integer, ForeignKey("trades.id", ondelete="CASCADE"), nullable=False)
    competency_id = Column(
        Integer,
        ForeignKey("trade_competencies.id", ondelete="SET NULL"),
        nullable=True,
    )
    code = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    objective = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="Draft")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
