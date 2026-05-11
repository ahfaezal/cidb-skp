from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from app.db.database import Base


class QuestionBuilderDraft(Base):
    __tablename__ = "question_builder_drafts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, default="Draf Soalan")
    owner_ref = Column(String(255), nullable=False, default="local-user")
    owner_name = Column(String(255), nullable=False, default="Pengguna")
    owner_role = Column(String(100), nullable=False, default="Fasilitator")
    project_ref = Column(String(255), nullable=False, default="General")
    visibility = Column(String(50), nullable=False, default="Private")
    status = Column(String(50), nullable=False, default="Draft")
    settings_json = Column(Text, nullable=False)
    files_json = Column(Text, nullable=False)
    questions_json = Column(Text, nullable=False)
    analysis_json = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
