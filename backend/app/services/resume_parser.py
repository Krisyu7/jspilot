import fitz  # pymupdf
from google import genai
import json
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.resume import Resume


def extract_text_from_pdf(file_path: str) -> str:
    """从PDF提取纯文本，使用pymupdf兼容LaTeX生成的PDF"""
    text = ""
    doc = fitz.open(file_path)
    for page in doc:
        text += page.get_text() + "\n"
    doc.close()
    return text.strip()


def parse_resume_with_ai(raw_text: str) -> dict:
    """用Gemini解析简历，提取结构化数据"""
    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    prompt = f"""
你是一个简历解析助手。请从以下简历文本中提取关键信息，以JSON格式返回。

简历内容：
{raw_text}

请返回以下JSON格式（只返回JSON，不要其他文字）：
{{
    "skills": ["技能1", "技能2"],
    "experience_years": 3,
    "education": "学历描述",
    "job_titles": ["职位1", "职位2"],
    "languages": ["English", "French"],
    "summary": "简短的个人总结"
}}
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
        print(f"AI解析简历失败: {e}")
        return {
            "skills": [],
            "experience_years": 0,
            "education": "",
            "job_titles": [],
            "languages": ["English"],
            "summary": ""
        }


def save_resume(db: Session, file_path: str, file_name: str, file_url: str = "") -> Resume:
    """解析并保存简历"""
    db.query(Resume).update({"is_active": False})
    db.commit()

    raw_text = extract_text_from_pdf(file_path)
    print(f"提取文字长度: {len(raw_text)} 字符")

    parsed_data = parse_resume_with_ai(raw_text)

    resume = Resume(
        file_url=file_url,
        file_name=file_name,
        raw_text=raw_text,
        parsed_data=parsed_data,
        is_active=True,
    )

    db.add(resume)
    db.commit()
    db.refresh(resume)

    return resume


def get_active_resume(db: Session) -> Resume | None:
    """获取当前激活的简历"""
    return db.query(Resume).filter(Resume.is_active == True).first()
