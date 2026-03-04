from sqlalchemy import Column, String, Text, Boolean, DateTime
from sqlalchemy.dialects.sqlite import JSON
from datetime import datetime
import uuid
from app.core.database import Base


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    file_url = Column(String(500))
    file_name = Column(String(255))
    raw_text = Column(Text)
    parsed_data = Column(JSON)          # {"skills": [], "experience_years": 3, ...}
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
