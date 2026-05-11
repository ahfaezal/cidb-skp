from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from app.db.database import Base


class MappingGrouping(Base):
    __tablename__ = "mapping_groupings"

    id = Column(Integer, primary_key=True, index=True)
    trade_id = Column(Integer, ForeignKey("trades.id", ondelete="CASCADE"), nullable=False)
    cmcs_id = Column(Integer, ForeignKey("cmcs.id", ondelete="SET NULL"), nullable=True)
    source_code = Column(String(50), nullable=False)
    source_title = Column(String(255), nullable=False)
    module_title = Column(String(255), nullable=False)
    module_objective = Column(Text, nullable=True)
    groups_json = Column(Text, nullable=False)
    status = Column(String(50), nullable=False, default="Saved")
    module_id = Column(Integer, ForeignKey("skp_modules.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
