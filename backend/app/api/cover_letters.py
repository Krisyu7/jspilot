from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.cover_letter import CoverLetter
from app.services.cover_letter_generator import generate_cover_letter

router = APIRouter(prefix="/cover-letters", tags=["cover-letters"])


@router.post("/{job_id}")
def create_cover_letter(job_id: str, db: Session = Depends(get_db)):
    """为指定职位生成Cover Letter"""
    try:
        cover_letter = generate_cover_letter(db, job_id)
        return {
            "id": cover_letter.id,
            "job_id": cover_letter.job_id,
            "content": cover_letter.content,
            "version": cover_letter.version,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{job_id}")
def get_cover_letters(job_id: str, db: Session = Depends(get_db)):
    """获取某职位的所有Cover Letter版本"""
    letters = (
        db.query(CoverLetter)
        .filter(CoverLetter.job_id == job_id)
        .order_by(CoverLetter.version.desc())
        .all()
    )

    return [
        {
            "id": cl.id,
            "content": cl.content,
            "version": cl.version,
            "created_at": cl.created_at,
        }
        for cl in letters
    ]
