from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
import app.models
from app.api import jobs, resume, filters, cover_letters, applications, optimized_resumes

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="JSPilot API",
    description="AI驱动的求职自动化工具",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(optimized_resumes.router)
app.include_router(resume.router)
app.include_router(filters.router)
app.include_router(jobs.router)
app.include_router(cover_letters.router)
app.include_router(applications.router)


@app.get("/")
def health_check():
    return {"status": "ok", "message": "JSPilot API is running"}
