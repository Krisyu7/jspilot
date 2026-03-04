from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.core.database import get_db
from app.models.job_filter import JobFilter

router = APIRouter(prefix="/filters", tags=["filters"])


class FilterRequest(BaseModel):
    keywords: List[str]
    locations: List[str]               # 支持多城市
    schedule_type: Optional[str] = None
    date_range: int = 7


@router.post("/")
def save_filter(request: FilterRequest, db: Session = Depends(get_db)):
    """保存筛选条件（只保留一条）"""
    db.query(JobFilter).delete()

    job_filter = JobFilter(
        keywords=request.keywords,
        locations=request.locations,
        schedule_type=request.schedule_type,
        date_range=request.date_range,
    )
    db.add(job_filter)
    db.commit()
    db.refresh(job_filter)

    return {
        "id": job_filter.id,
        "keywords": job_filter.keywords,
        "locations": job_filter.locations,
        "schedule_type": job_filter.schedule_type,
        "date_range": job_filter.date_range,
    }


@router.get("/")
def get_filter(db: Session = Depends(get_db)):
    """获取当前筛选条件"""
    job_filter = db.query(JobFilter).first()
    if not job_filter:
        raise HTTPException(status_code=404, detail="还没有设置筛选条件")

    return {
        "id": job_filter.id,
        "keywords": job_filter.keywords,
        "locations": job_filter.locations,
        "schedule_type": job_filter.schedule_type,
        "date_range": job_filter.date_range,
    }
