from fastapi import APIRouter
from ..models import AssistantChatRequest, AssistantChatResponse
from ..services.assistant_service import AssistantService

router = APIRouter(prefix="/api/assistant", tags=["GIRI AI Assistant"])

@router.post("/chat", response_model=AssistantChatResponse)
async def chat_with_assistant(req: AssistantChatRequest):
    return await AssistantService.process_chat(req)
