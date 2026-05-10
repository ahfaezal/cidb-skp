from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from app.db.database import Base


class CMCS(Base):
    __tablename__ = "cmcs"

    id = Column(Integer, primary_key=True, index=True)

    code = Column(String(50), nullable=True, unique=True, index=True)

    title = Column(String(255), nullable=False)

    description = Column(Text)

    level = Column(String(50))

    sector = Column(String(255))

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
