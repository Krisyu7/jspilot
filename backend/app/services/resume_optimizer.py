from google import genai
import json
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.job import Job
from app.models.optimized_resume import OptimizedResume
from app.services.resume_parser import get_active_resume


def generate_optimized_resume(db: Session, job_id: str) -> OptimizedResume:
    """为指定职位生成优化后的LaTeX简历"""

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise ValueError("职位不存在")

    resume = get_active_resume(db)
    if not resume:
        raise ValueError("请先上传简历")

    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    prompt = f"""
You are a professional resume writer specializing in Computer Science resumes.
Generate a targeted,
one-page resume based on the following requirements:

STRICT FORMATTING RULES:
- Balanced margins, sufficient white space
- Font: Arial or similar, 10-12pt for body text
- Clear, consistent section headings
- All dates right-aligned and consistent
- Reverse chronological order throughout
- No photo, no date of birth, no SIN number

REQUIRED SECTIONS IN ORDER:
1. HEADER: Full name (larger font), city, phone, email, GitHub,
   LinkedIn, portfolio link. Email must be professional.
2. EDUCATION: Degree + Major + University + Location + Start Year.
   Do NOT list courses unless they have a unique, specific learning
   outcome directly relevant to the job. GPA only if above 3.0.
3. TECHNICAL SKILLS: Group into logical categories (Languages,
   Backend, Frontend, Databases, Tools & Practices). 3-5 items per
   category. Do NOT include soft skills here.
4. TECHNICAL PROJECTS: 3-4 CS-relevant projects in reverse
   chronological order. Each project must include:
   - Project title + technologies used + dates
   - At least 3 bullet points per project
   - Every bullet begins with an action verb
   - Strictly follow this format:
     "Performed X by doing Y resulting in Z"
   - Include specific languages, frameworks, tools used
5. EXPERIENCE (if applicable): Relevant work, volunteer, or other
   experience in reverse chronological order.
6. REFERENCES: "Available upon request."

CONTENT RULES:
- Every bullet point must start with a strong action verb
- Focus on accomplishments, not duties
- Quantify results wherever possible
- Tailor all content to match keywords from the job posting
- Do NOT include soft skills in the skills section
- Do NOT use "responsible for" or "duties included"
- Keep bullet points to 1-2 lines maximum

OUTPUT FORMAT:
- Output ONLY valid LaTeX code
- Do NOT include any explanation or markdown
- Start directly with \\documentclass

JOB POSTING TO TARGET:
Title: {job.title}
Company: {job.company_name}
Description: {job.description[:3000] if job.description else "N/A"}

CANDIDATE INFORMATION:
{json.dumps(resume.parsed_data, ensure_ascii=False)}

Raw resume text:
{resume.raw_text[:3000] if resume.raw_text else "N/A"}
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-pro",
            contents=prompt
        )
        content = response.text.strip()

        # 清理可能的markdown代码块
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("latex") or content.startswith("tex"):
                content = content[content.index("\n")+1:]

    except Exception as e:
        raise ValueError(f"生成失败: {e}")

    optimized = OptimizedResume(
        job_id=job_id,
        content=content,
    )

    db.add(optimized)
    db.commit()
    db.refresh(optimized)

    return optimized