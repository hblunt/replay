import logging
import time

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from adapters.llm import ClaudeClient, LLMClient, MockLLMClient, ZAIClient
from config import settings
from steps.analyse_video import analyse_video
from steps.refine_prompt import refine_prompt
from test_seedance import router as seedance_test_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("reframe")

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


def _refine_llm() -> LLMClient:
    """LLM used for Seedance prompt refinement.

    Z.AI is preferred (hackathon-provided unlimited credit). Falls back to
    Claude, then Mock if neither key is set.
    """
    if settings.zai_api_key:
        log.info("using Z.AI (glm-4.6) for prompt refinement")
        return ZAIClient(api_key=settings.zai_api_key)
    if settings.anthropic_api_key:
        log.info("using Claude for prompt refinement (Z.AI key not set)")
        return ClaudeClient(api_key=settings.anthropic_api_key)
    log.warning("no LLM key set — falling back to MockLLMClient")
    return MockLLMClient()


@app.get("/")
def root():
    return {"status": "ok", "service": "reframe"}


class AnalyseRequest(BaseModel):
    video_url: str
    focus_prompt: str | None = None


@app.post("/analyse")
def analyse(req: AnalyseRequest):
    if not settings.anthropic_api_key:
        log.error("/analyse called but ANTHROPIC_API_KEY is empty")
        raise HTTPException(500, "ANTHROPIC_API_KEY is not set")

    log.info("/analyse received: video_url=%s focus=%r", req.video_url, req.focus_prompt)
    t0 = time.monotonic()
    try:
        summary = analyse_video(settings.anthropic_api_key, req.video_url, req.focus_prompt)
    except httpx.HTTPError as e:
        log.exception("video fetch failed")
        raise HTTPException(502, f"Could not fetch video: {e}") from e
    except Exception as e:
        log.exception("analyse failed")
        raise HTTPException(500, f"Analyse failed: {e}") from e

    log.info("analyse complete in %.1fs: %r", time.monotonic() - t0, summary[:200])
    return {"summary": summary}


class GenerateRequest(BaseModel):
    video_url: str
    coach_prompt: str
    duration: int = 5
    ratio: str = "16:9"
    resolution: str = "720p"


@app.post("/generate")
async def generate(req: GenerateRequest):
    if not settings.seedance_api_key:
        log.error("/generate called but SEEDANCE_API_KEY is empty")
        raise HTTPException(500, "SEEDANCE_API_KEY is not set")

    log.info("/generate received: video_url=%s coach_prompt=%r", req.video_url, req.coach_prompt[:120])

    t0 = time.monotonic()
    try:
        refined = refine_prompt(
            llm=_refine_llm(),
            coach_prompt=req.coach_prompt,
            video_url=req.video_url,
        )
    except Exception as e:
        log.exception("LLM refinement failed")
        raise HTTPException(500, f"LLM refinement failed: {e}") from e
    log.info("LLM refined in %.1fs: %r", time.monotonic() - t0, refined[:200])

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

    log.info("submitting Seedance task (model=%s, %ss @ %s/%s)",
             settings.seedance_model, req.duration, req.resolution, req.ratio)
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
        log.error("Seedance submit %d: %s", r.status_code, r.text[:500])
        raise HTTPException(r.status_code, f"Seedance error: {r.text}")

    data = r.json()
    task_id = data["id"]
    _REFINED_BY_TASK[task_id] = refined
    log.info("Seedance task submitted: %s", task_id)

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
        log.error("Seedance status %s: %d %s", task_id, r.status_code, r.text[:300])
        raise HTTPException(r.status_code, f"Seedance error: {r.text}")

    data = r.json()
    status_val = data.get("status")
    log.info("status %s -> %s", task_id, status_val)
    return {
        "task_id": task_id,
        "status": status_val,
        "generated_video_url": (data.get("content") or {}).get("video_url"),
        "refined_prompt": _REFINED_BY_TASK.get(task_id),
        "error": data.get("error"),
        "raw": data,
    }
