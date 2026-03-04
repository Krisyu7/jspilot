from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from datetime import datetime
import uuid
from app.core.database import Base


class Application(Base):
    __tablename__ = "applications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False)
    cover_letter_id = Column(String, ForeignKey("cover_letters.id"), nullable=True)
    status = Column(String(50), default="applied")  # applied / interview / rejected / offer / ghosted
    applied_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text)                # 用户备注
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
