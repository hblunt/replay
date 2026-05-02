"""Throwaway Seedance 2.0 validation harness.

Mounted under /test/seedance. Discard once we've confirmed the API works,
understood latency, and pinned the role/format that produces good output.
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
    task_type: str | None = None
    duration: int = 5
    ratio: str = "16:9"
    resolution: str = "720p"
    image_url: str | None = None
    image_role: str | None = None
    video_url: str | None = None
    video_role: str | None = None
    watermark: bool = False


def _build_content(req: SubmitRequest) -> list[dict]:
    content: list[dict] = [{"type": "text", "text": req.prompt}]
    if req.image_url:
        item: dict = {"type": "image_url", "image_url": {"url": req.image_url}}
        if req.image_role:
            item["role"] = req.image_role
        content.append(item)
    if req.video_url:
        item = {"type": "video_url", "video_url": {"url": req.video_url}}
        if req.video_role:
            item["role"] = req.video_role
        content.append(item)
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

    body: dict = {
        "model": req.model or settings.seedance_model,
        "content": _build_content(req),
        "resolution": req.resolution,
        "ratio": req.ratio,
        "duration": req.duration,
        "watermark": req.watermark,
    }
    if req.task_type:
        body["task_type"] = req.task_type

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
        raise HTTPException(r.status_code, f"Seedance error (sent body: {body}) :: {r.text}")
    return {"sent_body": body, "response": r.json()}


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


# Mode → (video role, image role, hint shown in UI). None = field omitted.
# These are best-guess defaults — when one fails, the API error usually lists valid values.
_MODES = {
    "r2v": {
        "task_type": "r2v",
        "video_role": "reference_video",
        "image_role": "reference_image",
        "hint": "Multimodal-to-Video. Reference is a stylistic hint; output is a NEW video. ✅ confirmed working.",
    },
    "v2v": {
        "task_type": "vedit",
        "video_role": "reference_video",
        "image_role": "reference_image",
        "hint": "Video Editing. Modifies the input video per the prompt. Reference video must be ≤15.2s on the fast model.",
    },
    "vext": {
        "task_type": "vext",
        "video_role": "reference_video",
        "image_role": None,
        "hint": "Video Extension. Continues the input video forward. Reference video must be ≤15.2s on the fast model.",
    },
    "i2v": {
        "task_type": "i2v",
        "video_role": None,
        "image_role": "first_frame",
        "hint": "First/Last Frame (image-to-video). Image becomes start frame. Set a second image with role='last_frame' for transition mode.",
    },
    "custom": {
        "task_type": None,
        "video_role": None,
        "image_role": None,
        "hint": "Custom — set task_type and roles manually below.",
    },
}


@router.get("/modes")
async def modes() -> dict:
    return _MODES


_PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Seedance 2.0 — validation harness</title>
<style>
  :root { color-scheme: light dark; }
  body { font: 14px/1.5 system-ui, sans-serif; max-width: 900px; margin: 2rem auto; padding: 0 1rem; }
  h1 { font-size: 1.2rem; margin-bottom: 0.25rem; }
  .sub { opacity: 0.7; margin-top: 0; margin-bottom: 1.5rem; }
  label { display: block; margin: 0.75rem 0 0.25rem; font-weight: 600; }
  input, textarea, select { width: 100%; padding: 0.5rem; font: inherit; box-sizing: border-box; }
  textarea { min-height: 90px; resize: vertical; }
  .row { display: flex; gap: 0.75rem; }
  .row > div { flex: 1; }
  button { margin-top: 1rem; padding: 0.6rem 1.2rem; font: inherit; cursor: pointer; }
  pre { background: rgba(127,127,127,0.12); padding: 0.75rem; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; font-size: 0.85em; }
  video { width: 100%; margin-top: 1rem; background: #000; }
  .status { margin-top: 1rem; }
  .timer { opacity: 0.7; font-variant-numeric: tabular-nums; }
  .or { opacity: 0.5; font-size: 0.9em; margin: 0.25rem 0; text-align: center; }
  .file-status { font-size: 0.85em; opacity: 0.75; margin-top: 0.25rem; min-height: 1.2em; }
  .hint { font-size: 0.85em; opacity: 0.75; padding: 0.5rem; background: rgba(127,127,127,0.08); border-left: 3px solid #888; margin-top: 0.25rem; }
  .panel { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
</style>
</head>
<body>
<h1>Seedance 2.0 — validation harness</h1>
<p class="sub">Throwaway. Pick a mode, upload reference media, submit. The exact JSON body sent to BytePlus is shown below the result.</p>

<form id="f">
  <label>Mode</label>
  <select id="mode" name="mode">
    <option value="r2v">Multimodal-to-Video (r2v) — reference, confirmed working</option>
    <option value="v2v">Video-to-Video editing (v2v) — modify input video</option>
    <option value="vext">Video Extension (vext) — continue input video</option>
    <option value="i2v">Image-to-Video (i2v) — first/last frame</option>
    <option value="custom">Custom — set everything manually</option>
  </select>
  <div class="hint" id="mode_hint"></div>

  <label>task_type override (advanced)</label>
  <input name="task_type" id="task_type" placeholder="(uses mode default)" />

  <label>Prompt</label>
  <textarea name="prompt" required placeholder="At 00:04 the right winger sprints diagonally toward the touchline as the flyhalf passes wide..."></textarea>

  <div class="panel">
    <div>
      <label>Reference video — upload</label>
      <input type="file" id="video_file" />
      <div class="file-status" id="video_status"></div>
      <div class="or">— or —</div>
      <input name="video_url" id="video_url" type="url" placeholder="public https:// URL or file-... id" />
      <label>Video role override</label>
      <input name="video_role" id="video_role" placeholder="(uses mode default)" />
    </div>
    <div>
      <label>Reference image — upload</label>
      <input type="file" id="image_file" />
      <div class="file-status" id="image_status"></div>
      <div class="or">— or —</div>
      <input name="image_url" id="image_url" type="url" placeholder="public https:// URL or file-... id" />
      <label>Image role override</label>
      <input name="image_role" id="image_role" placeholder="(uses mode default)" />
    </div>
  </div>

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
<video id="result" controls hidden></video>
<label id="raw_label" hidden>Sent body / final response</label>
<pre id="raw" hidden></pre>

<script>
const f = document.getElementById('f');
const statusEl = document.getElementById('status');
const rawEl = document.getElementById('raw');
const rawLabel = document.getElementById('raw_label');
const videoEl = document.getElementById('result');
const modeSel = document.getElementById('mode');
const modeHint = document.getElementById('mode_hint');
const videoRoleEl = document.getElementById('video_role');
const imageRoleEl = document.getElementById('image_role');

let MODES = {};
fetch('/test/seedance/modes').then(r => r.json()).then(m => {
  MODES = m;
  applyMode();
});

modeSel.addEventListener('change', applyMode);
function applyMode() {
  const m = MODES[modeSel.value];
  if (!m) return;
  modeHint.textContent = m.hint;
  videoRoleEl.placeholder = m.video_role ? `default: ${m.video_role}` : '(no default — set manually if needed)';
  imageRoleEl.placeholder = m.image_role ? `default: ${m.image_role}` : '(no default — set manually if needed)';
  document.getElementById('task_type').placeholder = m.task_type ? `default: ${m.task_type}` : '(no default)';
}

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
  videoEl.hidden = true; rawEl.hidden = true; rawLabel.hidden = true;
  statusEl.innerHTML = 'Submitting…';

  const fd = new FormData(f);
  const body = {};
  for (const [k, v] of fd.entries()) {
    if (v === '' || k === 'mode') continue;
    body[k] = (k === 'duration') ? Number(v) : v;
  }
  if (uploadedIds.image && !body.image_url) body.image_url = uploadedIds.image;
  if (uploadedIds.video && !body.video_url) body.video_url = uploadedIds.video;

  const m = MODES[modeSel.value];
  if (m) {
    if (!body.image_role && m.image_role && body.image_url) body.image_role = m.image_role;
    if (!body.video_role && m.video_role && body.video_url) body.video_role = m.video_role;
    if (!body.task_type && m.task_type) body.task_type = m.task_type;
  }

  let submit;
  try {
    const r = await fetch('/test/seedance/submit', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body),
    });
    submit = await r.json();
    if (!r.ok) throw new Error(submit.detail || JSON.stringify(submit));
  } catch (err) {
    statusEl.innerHTML = '<b>Submit failed:</b> ' + err.message;
    return;
  }

  const sentBody = submit.sent_body;
  const resp = submit.response || {};
  const taskId = resp.id || resp.task_id;
  if (!taskId) {
    statusEl.innerHTML = '<b>No task id in response.</b>';
    rawLabel.hidden = false; rawEl.hidden = false;
    rawEl.textContent = JSON.stringify({sent: sentBody, response: resp}, null, 2);
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
      if (!r.ok) throw new Error(s.detail || JSON.stringify(s));
    } catch (err) {
      statusEl.innerHTML = '<b>Poll failed:</b> ' + err.message;
      return;
    }
    last = s;
    statusEl.innerHTML = `task <code>${taskId}</code> — status: <b>${s.status}</b> <span class="timer">${tick()}s</span>`;
    if (['succeeded', 'failed', 'cancelled', 'canceled'].includes(s.status)) break;
  }

  rawLabel.hidden = false; rawEl.hidden = false;
  rawEl.textContent = JSON.stringify({sent: sentBody, final: last}, null, 2);
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
