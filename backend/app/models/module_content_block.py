from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from app.db.database import Base


class ModuleContentBlock(Base):
    __tablename__ = "module_content_blocks"

    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("skp_modules.id", ondelete="CASCADE"), nullable=True)
    package_id = Column(
        Integer,
        ForeignKey("learning_packages.id", ondelete="CASCADE"),
        nullable=True,
    )
    block_type = Column(String(50), nullable=False, default="paragraph")
    title = Column(String(255), nullable=True)
    content = Column(Text, nullable=True)
    metadata_json = Column(Text, nullable=True)
    sort_order = Column(Integer, nullable=False, default=0)
    ai_generated = Column(Boolean, nullable=False, default=False)
    review_status = Column(String(50), nullable=False, default="Draft")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
