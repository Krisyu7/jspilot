import os
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.resume_parser import save_resume, get_active_resume

router = APIRouter(prefix="/resume", tags=["resume"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """上传简历PDF"""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="只支持PDF格式")

    # 保存文件
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # 解析并存库
    resume = save_resume(db, file_path, file.filename)

    return {
        "id": resume.id,
        "file_name": resume.file_name,
        "parsed_data": resume.parsed_data,
        "message": "简历上传并解析成功"
    }


@router.get("/")
def get_resume(db: Session = Depends(get_db)):
    """获取当前简历"""
    resume = get_active_resume(db)
    if not resume:
        raise HTTPException(status_code=404, detail="还没有上传简历")

    return {
        "id": resume.id,
        "file_name": resume.file_name,
        "parsed_data": resume.parsed_data,
        "created_at": resume.created_at,
    }
