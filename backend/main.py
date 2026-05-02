import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from adapters.llm import ClaudeClient, LLMClient, MockLLMClient
from config import settings
from steps.refine_prompt import refine_prompt
from test_seedance import router as seedance_test_router

app = FastAPI(title="Reframe")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(seedance_test_router)


# Stage 1: in-memory task -> refined_prompt mapping. Replace with Butterbase in Stage 2.
_REFINED_BY_TASK: dict[str, str] = {}


def _llm() -> LLMClient:
    if settings.anthropic_api_key:
        return ClaudeClient(api_key=settings.anthropic_api_key)
    return MockLLMClient()


@app.get("/")
def root():
    return {"status": "ok", "service": "reframe"}


class GenerateRequest(BaseModel):
    video_url: str
    coach_prompt: str
    duration: int = 5
    ratio: str = "16:9"
    resolution: str = "720p"


@app.post("/generate")
async def generate(req: GenerateRequest):
    if not settings.seedance_api_key:
        raise HTTPException(500, "SEEDANCE_API_KEY is not set")

    refined = refine_prompt(
        llm=_llm(),
        coach_prompt=req.coach_prompt,
        video_url=req.video_url,
    )

    body = {
        "model": settings.seedance_model,
        "task_type": "vedit",
        "content": [
            {"type": "text", "text": refined},
            {
                "type": "video_url",
                "role": "reference_video",
                "video_url": {"url": req.video_url},
            },
        ],
        "resolution": req.resolution,
        "ratio": req.ratio,
        "duration": req.duration,
        "watermark": False,
    }

    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(
            f"{settings.seedance_base_url}/contents/generations/tasks",
            headers={
                "Authorization": f"Bearer {settings.seedance_api_key}",
                "Content-Type": "application/json",
            },
            json=body,
        )

    if r.status_code >= 400:
        raise HTTPException(r.status_code, f"Seedance error: {r.text}")

    data = r.json()
    task_id = data["id"]
    _REFINED_BY_TASK[task_id] = refined

    return {
        "task_id": task_id,
        "refined_prompt": refined,
        "video_url": req.video_url,
    }


@app.get("/status/{task_id}")
async def status(task_id: str):
    if not settings.seedance_api_key:
        raise HTTPException(500, "SEEDANCE_API_KEY is not set")

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(
            f"{settings.seedance_base_url}/contents/generations/tasks/{task_id}",
            headers={"Authorization": f"Bearer {settings.seedance_api_key}"},
        )

    if r.status_code >= 400:
        raise HTTPException(r.status_code, f"Seedance error: {r.text}")

    data = r.json()
    return {
        "task_id": task_id,
        "status": data.get("status"),
        "generated_video_url": (data.get("content") or {}).get("video_url"),
        "refined_prompt": _REFINED_BY_TASK.get(task_id),
        "error": data.get("error"),
        "raw": data,
    }
