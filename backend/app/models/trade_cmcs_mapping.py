from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from app.db.database import Base


class TradeCMCSMapping(Base):
    __tablename__ = "trade_cmcs_mappings"

    id = Column(Integer, primary_key=True, index=True)
    trade_id = Column(Integer, ForeignKey("trades.id", ondelete="CASCADE"), nullable=False)
    cmcs_id = Column(Integer, ForeignKey("cmcs.id", ondelete="CASCADE"), nullable=False)
    competency_unit_id = Column(
        Integer,
        ForeignKey("competency_units.id", ondelete="SET NULL"),
        nullable=True,
    )
    mapping_notes = Column(Text, nullable=True)
    trade_specific_content = Column(Text, nullable=True)
    draft_module_title = Column(String(255), nullable=True)
    draft_objective = Column(Text, nullable=True)
    draft_content_outline = Column(Text, nullable=True)
    suggested_learning_packages = Column(Text, nullable=True)
    suggested_assessment_areas = Column(Text, nullable=True)
    relevance_level = Column(String(50), nullable=False, default="Medium")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
