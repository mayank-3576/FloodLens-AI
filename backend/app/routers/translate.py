from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from ..services.bhashini_service import BhashiniService

router = APIRouter(prefix="/api/translate", tags=["Multilingual Intelligence"])

class TranslationRequest(BaseModel):
    text: str
    target_lang: str
    source_lang: Optional[str] = "en"

class LocalizedBulletinRequest(BaseModel):
    risk_level: str
    language: Optional[str] = "en"

@router.get("/languages")
def get_languages():
    return BhashiniService.get_supported_languages()

@router.post("")
async def translate_text(req: TranslationRequest):
    return await BhashiniService.translate_text(
        text=req.text,
        target_lang=req.target_lang,
        source_lang=req.source_lang or "en"
    )

@router.post("/bulletin")
def get_bulletin(req: LocalizedBulletinRequest):
    return BhashiniService.get_localized_safety_bulletin(
        risk_level=req.risk_level,
        lang=req.language or "en"
    )
