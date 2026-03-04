from sqlalchemy import Column, String, Text, DateTime
from datetime import datetime
import uuid
from app.core.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    company_name = Column(String(255))
    location = Column(String(255))
    posted_at = Column(String(100))     # "1 day ago" 原始格式
    schedule_type = Column(String(50))  # "Full-time" / "Part-time" / "Contract"
    salary = Column(String(255))        # 有就存，没有就null
    description = Column(Text)
    apply_link = Column(String(500))
    apply_type = Column(String(50))     # "company_site" / "linkedin"
    source_id = Column(String(255), unique=True)  # 去重用
    created_at = Column(DateTime, default=datetime.utcnow)
    summary = Column(Text, nullable=True)
