from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from schemas import CorrectionState
from test_seedance import router as seedance_test_router

app = FastAPI(title="Reframe")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(seedance_test_router)


@app.get("/")
def root():
    return {"status": "ok", "service": "reframe"}


@app.post("/upload")
async def upload(file: UploadFile = File(...), focus_prompt: str | None = Form(None)):
    raise NotImplementedError


@app.post("/analyse")
async def analyse(video_id: str):
    raise NotImplementedError


@app.post("/generate")
async def generate(state: CorrectionState):
    raise NotImplementedError


@app.get("/status/{job_id}")
async def status(job_id: str):
    raise NotImplementedError
