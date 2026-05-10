from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from database import Base

class CMCS(Base):
    __tablename__ = "cmcs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    level = Column(String(50), nullable=True)
    sector = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())