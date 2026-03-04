from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.dialects.sqlite import JSON
from datetime import datetime
import uuid
from app.core.database import Base


class JobFilter(Base):
    __tablename__ = "job_filters"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    keywords = Column(JSON)             # ["software engineer", "backend"]
    locations = Column(JSON)            # ["Vancouver, BC, Canada", "Burnaby, BC, Canada"]
    schedule_type = Column(String(50))  # "Full-time" / "Part-time" / "Contract" / None
    date_range = Column(Integer, default=7)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
