from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.models.application import Application
from app.models.job import Job

router = APIRouter(prefix="/applications", tags=["applications"])


class ApplicationRequest(BaseModel):
    job_id: str
    cover_letter_id: Optional[str] = None
    notes: Optional[str] = None


class StatusUpdateRequest(BaseModel):
    status: str
    notes: Optional[str] = None


@router.post("/")
def create_application(request: ApplicationRequest, db: Session = Depends(get_db)):
    """记录一次投递"""
    job = db.query(Job).filter(Job.id == request.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="职位不存在")

    application = Application(
        job_id=request.job_id,
        cover_letter_id=request.cover_letter_id,
        notes=request.notes,
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    return {
        "id": application.id,
        "job_id": application.job_id,
        "status": application.status,
        "applied_at": application.applied_at,
    }


@router.get("/")
def get_applications(db: Session = Depends(get_db)):
    """获取所有投递记录"""
    results = (
        db.query(Application, Job)
        .join(Job, Application.job_id == Job.id)
        .order_by(Application.applied_at.desc())
        .all()
    )

    return [
        {
            "id": app.id,
            "status": app.status,
            "applied_at": app.applied_at,
            "notes": app.notes,
            "job": {
                "title": job.title,
                "company_name": job.company_name,
                "location": job.location,
                "apply_link": job.apply_link,
            },
        }
        for app, job in results
    ]


@router.patch("/{application_id}")
def update_status(
    application_id: str,
    request: StatusUpdateRequest,
    db: Session = Depends(get_db)
):
    """更新投递状态"""
    valid_statuses = ["applied", "interview", "rejected", "offer", "ghosted"]
    if request.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"状态必须是: {valid_statuses}")

    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="记录不存在")

    app.status = request.status
    if request.notes:
        app.notes = request.notes
    db.commit()

    return {"id": app.id, "status": app.status}
