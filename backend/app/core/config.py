from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SERPAPI_KEY: str
    GEMINI_API_KEY: str
    DATABASE_URL: str = "sqlite:///./jspilot.db"

    class Config:
        env_file = ".env"


settings = Settings()
