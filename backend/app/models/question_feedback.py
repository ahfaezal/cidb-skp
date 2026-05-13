from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from app.db.database import Base


class QuestionFeedback(Base):
    __tablename__ = "question_feedback"

    id = Column(Integer, primary_key=True, index=True)
    owner_ref = Column(String(255), nullable=False)
    owner_name = Column(String(255), nullable=False)
    owner_role = Column(String(100), nullable=False)
    project_ref = Column(String(255), nullable=False)
    responses_json = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
