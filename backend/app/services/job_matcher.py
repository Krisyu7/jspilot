from google import genai
import json
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.job import Job
from app.models.job_match import JobMatch
from app.services.resume_parser import get_active_resume


def analyze_match(resume, job: Job) -> dict:
    """用Gemini分析简历和职位的匹配度"""
    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    prompt = f"""
你是一个求职顾问。请分析以下简历和职位的匹配程度。

简历信息：
{json.dumps(resume.parsed_data, ensure_ascii=False)}

职位信息：
职位：{job.title}
公司：{job.company_name}
描述：{job.description[:2000] if job.description else "无"}

请返回以下JSON格式（只返回JSON，不要其他文字）：
{{
    "match_score": 85,
    "match_reason": "技能高度匹配，有3年相关经验，但缺少AWS经验",
    "summary": "• Develop data integrations and SQL pipelines\n• Must: SQL, Python, Git, ETL basics\n• Nice: Snowflake, CI/CD"
}}

Additionally, summarize the job posting in 3-5 bullet points.
Focus only on: key responsibilities, required skills, and preferred skills.
Be concise. Each bullet max 15 words.
Ignore company intro, legal disclaimers, and equal opportunity statements.

match_score范围0-100，请客观评分。
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        text = response.text.strip()

        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]

        return json.loads(text)

    except Exception as e:
        print(f"AI匹配分析失败: {e}")
        return {"match_score": 0, "match_reason": "分析失败"}


def run_match_analysis(db: Session, job_ids: list = None) -> dict:
    """对所有还没有匹配结果的职位进行AI分析"""
    resume = get_active_resume(db)
    if not resume:
        return {"status": "error", "message": "请先上传简历"}

    matched_job_ids = db.query(JobMatch.job_id).subquery()
    query = db.query(Job).filter(Job.id.notin_(matched_job_ids))
    if job_ids:
        query = query.filter(Job.id.in_(job_ids))
    unmatched_jobs = query.all()

    if not unmatched_jobs:
        return {"status": "ok", "message": "所有职位已分析完毕", "analyzed": 0}

    analyzed = 0
    for job in unmatched_jobs:
        result = analyze_match(resume, job)

        match = JobMatch(
            job_id=job.id,
            match_score=result.get("match_score", 0),
            match_reason=result.get("match_reason", ""),
        )
        db.add(match)
        summary = result.get("summary", "")
        if isinstance(summary, list):
            summary = "\n".join(summary)
        job.summary = summary
        db.add(job)
        analyzed += 1

    db.commit()

    return {
        "status": "ok",
        "analyzed": analyzed,
    }
