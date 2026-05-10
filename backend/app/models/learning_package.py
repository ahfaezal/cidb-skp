from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from app.db.database import Base


class LearningPackage(Base):
    __tablename__ = "learning_packages"

    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(
        Integer,
        ForeignKey("skp_modules.id", ondelete="CASCADE"),
        nullable=False,
    )
    code = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    objective = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    content_outline = Column(Text, nullable=True)
    references = Column(Text, nullable=True)
    exercises = Column(Text, nullable=True)
    answer_scheme = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="Draft")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
