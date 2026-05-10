from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from app.db.database import Base


class TradeCompetency(Base):
    __tablename__ = "trade_competencies"

    id = Column(Integer, primary_key=True, index=True)
    trade_id = Column(Integer, ForeignKey("trades.id", ondelete="CASCADE"), nullable=False)
    mapping_id = Column(
        Integer,
        ForeignKey("trade_cmcs_mappings.id", ondelete="SET NULL"),
        nullable=True,
    )
    code = Column(String(50), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    source_notes = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="Draft")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
