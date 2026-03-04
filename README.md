# JSPilot 🚀

An AI-powered job application automation tool that reduces your application time from 30 minutes to 2 minutes.

## Features

- **Auto Job Fetching** — Searches Google Jobs across multiple cities and keywords via SerpApi
- **AI Resume Parsing** — Extracts skills, experience, education from your PDF resume
- **AI Match Analysis** — Scores each job 0-100 based on your resume fit, with detailed reasoning
- **Smart JD Summary** — Condenses long job descriptions into 5 bullet points
- **Cover Letter Generation** — Generates tailored, professional cover letters for each job
- **Resume Optimization** — Generates a job-targeted LaTeX resume (.tex) ready for Overleaf
- **Application Tracker** — Track your applications with status updates (Applied, Interview, Offer, Rejected, Ghosted)

## Tech Stack

**Backend**
- Python + FastAPI
- SQLAlchemy + SQLite
- Google Gemini API (gemini-2.0-flash, gemini-2.5-pro)
- SerpApi (Google Jobs)
- PyMuPDF (PDF parsing)

**Frontend**
- Next.js 15 + TypeScript
- App Router
- Vanilla CSS-in-JS

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- SerpApi API key — [serpapi.com](https://serpapi.com)
- Google Gemini API key — [aistudio.google.com](https://aistudio.google.com)

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:
```
SERPAPI_KEY=your_serpapi_key
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=sqlite:///./jspilot.db
```

Start the backend:
```bash
python -m uvicorn app.main:app --reload
```

API docs available at `http://localhost:8000/docs`

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`

## Usage

1. **Upload Resume** — Go to `/setup`, upload your PDF resume. AI will parse and store it.
2. **Set Filters** — Enter job keywords and locations on the main page.
3. **Fetch Jobs** — Click "Fetch Jobs" to pull listings from Google Jobs.
4. **Analyze Match** — Select jobs you're interested in, click "Analyze" to get AI match scores.
5. **View Details** — Click into a job to see the full description and match reasoning.
6. **Generate Cover Letter** — One click to generate a tailored cover letter.
7. **Generate Resume** — Generate a LaTeX resume optimized for the job, download and compile on Overleaf.
8. **Track Applications** — Mark jobs as Applied, Interview, Offer, Rejected, or Ghosted.

## Project Structure
```
jspilot/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers
│   │   ├── core/         # Database + config
│   │   ├── models/       # SQLAlchemy models
│   │   └── services/     # Business logic + AI
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    └── app/
        ├── page.tsx          # Job listings
        ├── setup/page.tsx    # Resume upload
        ├── jobs/[id]/page.tsx # Job detail + CL + Resume
        └── applications/page.tsx # Application tracker
```

## Notes

- This is a V1 open-source self-hosted tool. Users provide their own API keys.
- Job data is sourced from Google Jobs via SerpApi, filtered to the past 7 days.
- Generated LaTeX resumes require compilation via [Overleaf](https://overleaf.com) or a local TeX installation.
- SQLite is used for simplicity. Data is stored locally.

## License

MIT