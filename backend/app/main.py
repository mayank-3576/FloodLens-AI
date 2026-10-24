import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .database import init_db
from .routers import (
    dashboard, locations, rainfall, flood_incidents,
    data_sources, assistant, imports, auth,
    community_reports, admin, early_warnings, sync,
    translate
)

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("floodlens")

# Initialize database schema immediately on import
init_db()

app = FastAPI(
    title="FloodLens AI — API",
    description="Multi-Stage Flood Early Warning, Local Flood Awareness & Historical Risk Intelligence Platform",
    version="2.0.0"
)

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(dashboard.router)
app.include_router(locations.router)
app.include_router(rainfall.router)
app.include_router(flood_incidents.router)
app.include_router(data_sources.router)
app.include_router(assistant.router)
app.include_router(imports.router)
app.include_router(auth.router)
app.include_router(community_reports.router)
app.include_router(admin.router)
app.include_router(early_warnings.router)
app.include_router(sync.router)
app.include_router(translate.router)

@app.get("/api/health", tags=["System Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "FloodLens AI / GIRIRAKSHAK AI Backend",
        "version": "2.0.0",
        "mode": "Multi-Stage Early Warning & Disaster Awareness Platform"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
