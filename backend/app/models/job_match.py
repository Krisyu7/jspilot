from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, ForeignKey
from datetime import datetime
import uuid
from app.core.database import Base


class JobMatch(Base):
    __tablename__ = "job_matches"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False)
    match_score = Column(Integer)       # 0-100
    match_reason = Column(Text)         # AI给出的匹配理由
    is_viewed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
