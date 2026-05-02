"""Throwaway Seedance 2.0 validation harness.

Mounted under /test/seedance. Discard once we've confirmed the API works,
understood latency, and pinned a prompt format that produces good output.
"""

from __future__ import annotations

import httpx
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from config import settings

router = APIRouter(prefix="/test/seedance", tags=["test-seedance"])


class SubmitRequest(BaseModel):
    prompt: str
    model: str | None = None
    duration: int = 5
    ratio: str = "16:9"
    resolution: str = "720p"
    image_url: str | None = None
    video_url: str | None = None
    watermark: bool = False


def _build_content(req: SubmitRequest) -> list[dict]:
    content: list[dict] = [{"type": "text", "text": req.prompt}]
    if req.image_url:
        content.append({"type": "image_url", "image_url": {"url": req.image_url}})
    if req.video_url:
        content.append(
            {
                "type": "video_url",
                "role": "reference_video",
                "video_url": {"url": req.video_url},
            }
        )
    return content


def _require_key():
    if not settings.seedance_api_key:
        raise HTTPException(500, "SEEDANCE_API_KEY is not set")


@router.post("/upload")
async def upload(file: UploadFile = File(...)):
    """Upload a local file to BytePlus Files API and return its file id."""
    _require_key()
    payload = await file.read()
    async with httpx.AsyncClient(timeout=300) as client:
        r = await client.post(
            f"{settings.seedance_base_url}/files",
            headers={"Authorization": f"Bearer {settings.seedance_api_key}"},
            files={"file": (file.filename, payload, file.content_type or "application/octet-stream")},
            data={"purpose": "user_data"},
        )
    if r.status_code >= 400:
        raise HTTPException(r.status_code, f"Files API error: {r.text}")
    return r.json()


@router.post("/submit")
async def submit(req: SubmitRequest):
    _require_key()

    body = {
        "model": req.model or settings.seedance_model,
        "content": _build_content(req),
        "resolution": req.resolution,
        "ratio": req.ratio,
        "duration": req.duration,
        "watermark": req.watermark,
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
    return r.json()


@router.get("/status/{task_id}")
async def status(task_id: str):
    _require_key()
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(
            f"{settings.seedance_base_url}/contents/generations/tasks/{task_id}",
            headers={"Authorization": f"Bearer {settings.seedance_api_key}"},
        )
    if r.status_code >= 400:
        raise HTTPException(r.status_code, f"Seedance error: {r.text}")
    return r.json()


_PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Seedance 2.0 — validation harness</title>
<style>
  :root { color-scheme: light dark; }
  body { font: 14px/1.5 system-ui, sans-serif; max-width: 820px; margin: 2rem auto; padding: 0 1rem; }
  h1 { font-size: 1.2rem; margin-bottom: 0.25rem; }
  .sub { opacity: 0.7; margin-top: 0; margin-bottom: 1.5rem; }
  label { display: block; margin: 0.75rem 0 0.25rem; font-weight: 600; }
  input, textarea, select { width: 100%; padding: 0.5rem; font: inherit; box-sizing: border-box; }
  textarea { min-height: 90px; resize: vertical; }
  .row { display: flex; gap: 0.75rem; }
  .row > div { flex: 1; }
  button { margin-top: 1rem; padding: 0.6rem 1.2rem; font: inherit; cursor: pointer; }
  pre { background: rgba(127,127,127,0.12); padding: 0.75rem; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; }
  video { width: 100%; margin-top: 1rem; background: #000; }
  .status { margin-top: 1rem; }
  .timer { opacity: 0.7; font-variant-numeric: tabular-nums; }
  .or { opacity: 0.5; font-size: 0.9em; margin: 0.25rem 0; text-align: center; }
  .file-status { font-size: 0.85em; opacity: 0.75; margin-top: 0.25rem; min-height: 1.2em; }
</style>
</head>
<body>
<h1>Seedance 2.0 — validation harness</h1>
<p class="sub">Throwaway. Reference image/video can be uploaded directly OR pasted as a public URL.</p>

<form id="f">
  <label>Prompt</label>
  <textarea name="prompt" required placeholder="At 00:04 the right winger sprints diagonally toward the touchline as the flyhalf passes wide..."></textarea>

  <label>Reference video — upload</label>
  <input type="file" id="video_file" />
  <div class="file-status" id="video_status"></div>
  <div class="or">— or —</div>
  <input name="video_url" id="video_url" type="url" placeholder="public https:// URL" />

  <label>Reference image — upload</label>
  <input type="file" id="image_file" />
  <div class="file-status" id="image_status"></div>
  <div class="or">— or —</div>
  <input name="image_url" id="image_url" type="url" placeholder="public https:// URL" />

  <div class="row">
    <div>
      <label>Model</label>
      <input name="model" placeholder="(uses SEEDANCE_MODEL from .env)" />
    </div>
    <div>
      <label>Duration (s)</label>
      <input name="duration" type="number" value="5" min="2" max="15" />
    </div>
    <div>
      <label>Ratio</label>
      <select name="ratio">
        <option>16:9</option><option>9:16</option><option>4:3</option>
        <option>3:4</option><option>1:1</option><option>21:9</option>
      </select>
    </div>
    <div>
      <label>Resolution</label>
      <select name="resolution">
        <option>720p</option><option>480p</option><option>1080p</option><option>2k</option>
      </select>
    </div>
  </div>

  <button type="submit">Submit</button>
</form>

<div class="status" id="status"></div>
<pre id="raw" hidden></pre>
<video id="result" controls hidden></video>

<script>
const f = document.getElementById('f');
const statusEl = document.getElementById('status');
const rawEl = document.getElementById('raw');
const videoEl = document.getElementById('result');

const uploadedIds = { image: null, video: null };

async function uploadFile(kind) {
  const fileInput = document.getElementById(kind + '_file');
  const statusDiv = document.getElementById(kind + '_status');
  const file = fileInput.files[0];
  if (!file) { uploadedIds[kind] = null; statusDiv.textContent = ''; return; }
  statusDiv.textContent = `Uploading ${file.name}…`;
  const fd = new FormData();
  fd.append('file', file);
  const r = await fetch('/test/seedance/upload', { method: 'POST', body: fd });
  const data = await r.json();
  if (!r.ok) {
    uploadedIds[kind] = null;
    statusDiv.textContent = 'Upload failed: ' + (data.detail || JSON.stringify(data));
    return;
  }
  uploadedIds[kind] = data.id;
  statusDiv.textContent = `Uploaded — id: ${data.id} (${data.bytes} bytes, ${data.status})`;
}

document.getElementById('image_file').addEventListener('change', () => uploadFile('image'));
document.getElementById('video_file').addEventListener('change', () => uploadFile('video'));

f.addEventListener('submit', async (e) => {
  e.preventDefault();
  videoEl.hidden = true; rawEl.hidden = true;
  statusEl.innerHTML = 'Submitting…';

  const fd = new FormData(f);
  const body = {};
  for (const [k, v] of fd.entries()) {
    if (v === '') continue;
    body[k] = (k === 'duration') ? Number(v) : v;
  }
  if (uploadedIds.image && !body.image_url) body.image_url = uploadedIds.image;
  if (uploadedIds.video && !body.video_url) body.video_url = uploadedIds.video;

  let submit;
  try {
    const r = await fetch('/test/seedance/submit', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body),
    });
    submit = await r.json();
    if (!r.ok) throw new Error(JSON.stringify(submit));
  } catch (err) {
    statusEl.innerHTML = '<b>Submit failed:</b> ' + err.message;
    return;
  }

  const taskId = submit.id || submit.task_id;
  if (!taskId) {
    statusEl.innerHTML = '<b>No task id in response:</b>';
    rawEl.hidden = false; rawEl.textContent = JSON.stringify(submit, null, 2);
    return;
  }

  const t0 = Date.now();
  const tick = () => Math.round((Date.now() - t0) / 1000);
  let last = null;

  while (true) {
    await new Promise(r => setTimeout(r, 3000));
    let s;
    try {
      const r = await fetch('/test/seedance/status/' + encodeURIComponent(taskId));
      s = await r.json();
      if (!r.ok) throw new Error(JSON.stringify(s));
    } catch (err) {
      statusEl.innerHTML = '<b>Poll failed:</b> ' + err.message;
      return;
    }
    last = s;
    statusEl.innerHTML = `task <code>${taskId}</code> — status: <b>${s.status}</b> <span class="timer">${tick()}s</span>`;
    if (['succeeded', 'failed', 'cancelled', 'canceled'].includes(s.status)) break;
  }

  rawEl.hidden = false;
  rawEl.textContent = JSON.stringify(last, null, 2);
  const url = last && last.content && last.content.video_url;
  if (url) { videoEl.src = url; videoEl.hidden = false; }
});
</script>
</body>
</html>
"""


@router.get("", response_class=HTMLResponse)
async def page() -> str:
    return _PAGE
