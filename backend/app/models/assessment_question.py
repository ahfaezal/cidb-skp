from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from app.db.database import Base


class AssessmentQuestion(Base):
    __tablename__ = "assessment_questions"

    id = Column(Integer, primary_key=True, index=True)
    package_id = Column(
        Integer,
        ForeignKey("learning_packages.id", ondelete="CASCADE"),
        nullable=False,
    )
    question_type = Column(String(50), nullable=False, default="Subjective")
    question_text = Column(Text, nullable=False)
    answer_scheme = Column(Text, nullable=True)
    rubric = Column(Text, nullable=True)
    marks = Column(Integer, nullable=False, default=1)
    status = Column(String(50), nullable=False, default="Draft")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
