import requests
import time
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.job import Job
from app.models.job_filter import JobFilter


AGGREGATOR_DOMAINS = [
    "indeed", "glassdoor", "ziprecruiter", "workopolis",
    "eluta", "builtin", "monster", "careerbuilder",
    "simplyhired", "jobbank", "workday", "bebee",
    "sercanto", "jobzmall", "pitchmeai", "showbizjobs"
]


def extract_best_apply_link(apply_options: list) -> dict:
    if not apply_options:
        return {"type": "unknown", "link": ""}

    for option in apply_options:
        link = option.get("link", "").lower()
        if not any(agg in link for agg in AGGREGATOR_DOMAINS):
            return {"type": "company_site", "link": option["link"]}

    for option in apply_options:
        if "linkedin" in option.get("link", "").lower():
            return {"type": "linkedin", "link": option["link"]}

    return {"type": "other", "link": apply_options[0].get("link", "")}


def extract_salary(job_data: dict) -> str | None:
    extensions = job_data.get("detected_extensions", {})
    salary = extensions.get("salary", None)
    if salary:
        return salary

    for ext in job_data.get("extensions", []):
        if any(sym in ext for sym in ["$", "CAD", "USD", "/hr", "/year", "per hour", "per year"]):
            return ext

    return None


def fetch_jobs_from_serpapi(query: str, location: str) -> list:
    params = {
        "engine": "google_jobs",
        "q": query,
        "location": location,
        "hl": "en",
        "chips": "date_posted:week",
        "api_key": settings.SERPAPI_KEY,
    }

    try:
        response = requests.get(
            "https://serpapi.com/search",
            params=params,
            timeout=15
        )
        data = response.json()

        if "error" in data:
            print(f"SerpApi错误: {data['error']}")
            return []

        return data.get("jobs_results", [])

    except Exception as e:
        print(f"抓取失败 [{query} @ {location}]: {e}")
        return []


def parse_job(raw_job: dict) -> dict:
    detected = raw_job.get("detected_extensions", {})
    apply_options = raw_job.get("apply_options", [])
    apply_info = extract_best_apply_link(apply_options)

    share_link = raw_job.get("share_link", "")
    source_id = raw_job.get("job_id") or share_link[-50:] or raw_job.get("title", "") + raw_job.get("company_name", "")

    return {
        "title": raw_job.get("title"),
        "company_name": raw_job.get("company_name"),
        "location": raw_job.get("location"),
        "posted_at": detected.get("posted_at"),
        "schedule_type": detected.get("schedule_type"),
        "salary": extract_salary(raw_job),
        "description": raw_job.get("description"),
        "apply_link": apply_info["link"],
        "apply_type": apply_info["type"],
        "source_id": source_id,
    }


def save_job(db: Session, job_data: dict) -> Job | None:
    existing = db.query(Job).filter(
        Job.source_id == job_data["source_id"]
    ).first()

    if existing:
        return None

    job = Job(**job_data)
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def run_job_fetch(db: Session) -> dict:
    job_filter = db.query(JobFilter).first()

    if not job_filter:
        return {"status": "error", "message": "请先设置筛选条件"}

    keywords = job_filter.keywords or []
    locations = job_filter.locations or ["Vancouver, BC, Canada"]

    total_fetched = 0
    total_saved = 0
    total_skipped = 0

    # 遍历所有城市 × 所有关键词组合
    for location in locations:
        for keyword in keywords:
            print(f"抓取: {keyword} @ {location}")
            raw_jobs = fetch_jobs_from_serpapi(keyword, location)

            for raw_job in raw_jobs:
                total_fetched += 1
                job_data = parse_job(raw_job)

                if not job_data["apply_link"]:
                    total_skipped += 1
                    continue

                saved = save_job(db, job_data)
                if saved:
                    total_saved += 1
                else:
                    total_skipped += 1

            time.sleep(1)

    return {
        "status": "ok",
        "fetched": total_fetched,
        "saved": total_saved,
        "skipped": total_skipped,
    }
