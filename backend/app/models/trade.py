from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from app.db.database import Base


class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), nullable=False, unique=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    sector = Column(String(255), nullable=True)
    category_code = Column(String(50), nullable=True)
    category_name = Column(String(255), nullable=True)
    field_title = Column(String(255), nullable=True)
    facilitator_name = Column(String(255), nullable=True)
    custom_category = Column(String(255), nullable=True)
    custom_field_title = Column(String(255), nullable=True)
    status = Column(String(50), nullable=False, default="Active")
    workflow_status = Column(String(100), nullable=False, default="Mapping Process")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
