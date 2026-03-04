from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey
from datetime import datetime
import uuid
from app.core.database import Base


class CoverLetter(Base):
    __tablename__ = "cover_letters"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False)
    content = Column(Text, nullable=False)
    version = Column(Integer, default=1)  # 同一职位可多次生成
    created_at = Column(DateTime, default=datetime.utcnow)
