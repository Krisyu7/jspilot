from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.optimized_resume import OptimizedResume
from app.services.resume_optimizer import generate_optimized_resume

router = APIRouter(prefix="/optimized-resumes", tags=["optimized-resumes"])


@router.post("/{job_id}")
def create_optimized_resume(job_id: str, db: Session = Depends(get_db)):
    """为指定职位生成优化简历"""
    try:
        result = generate_optimized_resume(db, job_id)
        return {
            "id": result.id,
            "job_id": result.job_id,
            "content": result.content,
            "created_at": result.created_at,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{job_id}/download")
def download_optimized_resume(job_id: str, db: Session = Depends(get_db)):
    """下载指定职位的LaTeX简历文件"""
    result = db.query(OptimizedResume).filter(
        OptimizedResume.job_id == job_id
    ).order_by(OptimizedResume.created_at.desc()).first()

    if not result:
        raise HTTPException(status_code=404, detail="还没有生成简历，请先POST生成")

    # 直接返回.tex文件供下载
    return Response(
        content=result.content,
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename=resume_{job_id[:8]}.tex"}
    )