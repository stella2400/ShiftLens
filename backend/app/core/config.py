from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "ShiftLens"
    env: str = "development"
    database_url: str = f"sqlite:///{BASE_DIR / 'shiftlens.db'}"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    uploads_dir: str = str(BASE_DIR / "uploads")
    frontend_url: str = "http://localhost:5173"
    demo_user_full_name: str = "Marino E."

    hf_token: str = ""
    hf_model: str = "Qwen/Qwen2.5-VL-7B-Instruct"

    jwt_secret_key: str = "change_me_super_secret"
    jwt_expire_minutes: int = 60 * 24 * 7

    model_config = SettingsConfigDict(env_file=str(BASE_DIR / ".env"), env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    settings = Settings()
    Path(settings.uploads_dir).mkdir(parents=True, exist_ok=True)
    return settings
