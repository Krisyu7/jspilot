from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.job import Job
from app.models.job_match import JobMatch
from app.services.job_fetcher import run_job_fetch
from app.services.job_matcher import run_match_analysis
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("/fetch")
def fetch_jobs(db: Session = Depends(get_db)):
    """触发职位抓取"""
    result = run_job_fetch(db)
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    return result

class MatchRequest(BaseModel):
    job_ids: Optional[List[str]] = None

@router.post("/match")
def match_jobs(request: MatchRequest = MatchRequest(), db: Session = Depends(get_db)):
    """触发AI匹配分析，可指定job_ids，不传则分析所有未匹配职位"""
    result = run_match_analysis(db, job_ids=request.job_ids)
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@router.get("/")
def get_jobs(db: Session = Depends(get_db)):
    """获取所有职位，按匹配分数排序"""
    results = (
        db.query(Job, JobMatch)
        .outerjoin(JobMatch, Job.id == JobMatch.job_id)
        .order_by(JobMatch.match_score.desc().nullslast())
        .all()
    )

    jobs = []
    for job, match in results:
        jobs.append({
            "id": job.id,
            "title": job.title,
            "company_name": job.company_name,
            "location": job.location,
            "posted_at": job.posted_at,
            "schedule_type": job.schedule_type,
            "salary": job.salary,
            "apply_link": job.apply_link,
            "apply_type": job.apply_type,
            "match_score": match.match_score if match else None,
            "match_reason": match.match_reason if match else None,
            "is_viewed": match.is_viewed if match else False,
        })

    return jobs


@router.get("/{job_id}")
def get_job_detail(job_id: str, db: Session = Depends(get_db)):
    """获取职位详情"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="职位不存在")

    # 标记为已读
    match = db.query(JobMatch).filter(JobMatch.job_id == job_id).first()
    if match and not match.is_viewed:
        match.is_viewed = True
        db.commit()

    return {
        "id": job.id,
        "title": job.title,
        "company_name": job.company_name,
        "location": job.location,
        "posted_at": job.posted_at,
        "schedule_type": job.schedule_type,
        "salary": job.salary,
        "description": job.description,
        "apply_link": job.apply_link,
        "apply_type": job.apply_type,
        "match_score": match.match_score if match else None,
        "match_reason": match.match_reason if match else None,
        "summary": job.summary if job.summary else None,
    }
