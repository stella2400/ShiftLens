from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from app.api.routes import router
from app.core.config import get_settings
from app.db.session import init_db

settings = get_settings()
app = FastAPI(title=settings.app_name, version='2.0.0')
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router, prefix='/api')


@app.on_event('startup')
def on_startup() -> None:
    init_db()
