from google import genai
import json
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.job import Job
from app.models.cover_letter import CoverLetter
from app.services.resume_parser import get_active_resume


def generate_cover_letter(db: Session, job_id: str) -> CoverLetter:
    """为指定职位生成Cover Letter"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise ValueError("职位不存在")

    resume = get_active_resume(db)
    if not resume:
        raise ValueError("请先上传简历")

    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    prompt = f"""
    You are a professional cover letter writer.
    Write a strong, customized cover letter for the candidate described below.

    Write a strong, customized cover letter following these STRICT rules:

    STRUCTURE - 4 paragraphs only:
    - Paragraph 1: Introduce the candidate enthusiastically. State the position and company. Set an excited, confident tone.
    - Paragraph 2: Prove fit - link the job posting requirements directly to the candidate's strongest technical competencies and projects. Use specific examples.
    - Paragraph 3: Prove fit - provide more context from the resume. Highlight a specific project or experience that directly maps to the job's needs. Be concrete, not generic.
    - Paragraph 4: Thank the hiring team. Restate excitement and suitability. End with a call to action.

    CONTENT RULES:
    - Reuse key phrases and keywords directly from the job posting
    - Every sentence must stress how the candidate will CONTRIBUTE to the company
    - Be specific - mention actual technologies, project names, and measurable outcomes
    - Do NOT use generic phrases like "I am a fast learner" or "I am passionate about"
    - Do NOT use "responsible for" or "duties included"
    - Write professionally and concisely
    - Each paragraph should be 3-5 sentences max

    CANDIDATE INFORMATION:
    {json.dumps(resume.parsed_data, ensure_ascii=False)}

    Raw resume text:
    {resume.raw_text[:2000] if resume.raw_text else "N/A"}

    JOB POSTING:
    Title: {job.title}
    Company: {job.company_name}
    Description: {job.description[:2000] if job.description else "N/A"}

    Output only the cover letter body text. No subject line. No headers. Start directly with "Dear Hiring Manager,".
    """

    try:
        response = client.models.generate_content(
            model="gemini-2.5-pro",
            contents=prompt
        )
        content = response.text.strip()
    except Exception as e:
        raise ValueError(f"生成失败: {e}")

    existing_count = db.query(CoverLetter).filter(
        CoverLetter.job_id == job_id
    ).count()

    cover_letter = CoverLetter(
        job_id=job_id,
        content=content,
        version=existing_count + 1,
    )

    db.add(cover_letter)
    db.commit()
    db.refresh(cover_letter)

    return cover_letter
