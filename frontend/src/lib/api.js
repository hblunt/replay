// Stage 1 API layer.
// /generate is REAL (FastAPI → LLM refine → Seedance vedit).
// /analyse remains mocked (Roboflow tracking is Stage 2).

import { getState, SAMPLE_VIDEO_URL } from './store';

const BACKEND_URL = 'http://localhost:8000';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const uid = () => Math.random().toString(36).slice(2, 10);

const jobs = {};

// ─── Upload (Stage 1: just records the URL the user picked) ────────────────
export async function uploadVideo(file, focusPrompt) {
  await sleep(300);
  return {
    video_id: 'vid_' + uid(),
    filename: file?.name || 'sample_clip.mp4',
    duration: 9.4,
    size_bytes: file?.size || 12_400_000,
    uploaded_at: new Date().toISOString(),
    focus_prompt: focusPrompt || null,
  };
}

// ─── Analyse (mocked summary — no Roboflow yet) ────────────────────────────
export async function analyseVideo(video_id) {
  await sleep(120);
  const job_id = 'job_' + uid();
  jobs[job_id] = {
    kind: 'analyse',
    video_id,
    started: Date.now(),
    steps: [
      { name: 'load_clip',       label: 'Loading clip',                        status: 'pending', duration: 700 },
      { name: 'analyse_tactics', label: 'Generating coaching context (LLM)',   status: 'pending', duration: 1200 },
    ],
  };
  runMockJob(job_id);
  return { job_id };
}

// ─── Generate (REAL backend call) ──────────────────────────────────────────
export async function generateVideo(globalPrompt, annotations = []) {
  const state = getState();
  const video_url = state.video?.url || SAMPLE_VIDEO_URL;
  const coach_prompt = synthesiseCoachPrompt(globalPrompt, annotations);

  console.log('[generate] submitting', { video_url, coach_prompt });
  let res;
  try {
    const r = await fetch(`${BACKEND_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_url, coach_prompt }),
    });
    let data;
    try { data = await r.json(); }
    catch { throw new Error(`status ${r.status}: response was not JSON`); }
    if (!r.ok) throw new Error(`status ${r.status}: ${data.detail || JSON.stringify(data)}`);
    res = data;
    console.log('[generate] submitted', res);
  } catch (err) {
    console.error('[generate] submit failed:', err);
    const job_id = 'job_' + uid();
    jobs[job_id] = {
      kind: 'generate-failed',
      started: Date.now(),
      steps: stageSteps('failed'),
      state: 'failed',
      error: 'Submit failed: ' + err.message,
    };
    return { job_id };
  }

  const job_id = res.task_id;
  jobs[job_id] = {
    kind: 'generate',
    coach_prompt,
    refined_prompt: res.refined_prompt,
    video_url,
    started: Date.now(),
    steps: stageSteps('running'),
    state: 'running',
  };
  return { job_id };
}

function synthesiseCoachPrompt(globalPrompt, annotations) {
  const parts = [];
  if (globalPrompt && globalPrompt.trim()) parts.push(globalPrompt.trim());

  // Stage 1: only "note" annotations carry text the LLM can act on.
  // Pin/draw are visual. Surface them as anchor markers for the LLM.
  for (const a of annotations) {
    if (a.type === 'note' && a.text) {
      parts.push(`At ${a.t.toFixed(1)}s, the coach noted at field position (${a.x.toFixed(2)}, ${a.y.toFixed(2)}): ${a.text}`);
    } else if (a.type === 'pin') {
      parts.push(`At ${a.t.toFixed(1)}s, the coach pinned attention to field position (${a.x.toFixed(2)}, ${a.y.toFixed(2)}).`);
    }
  }
  return parts.join(' ') || 'modify the play as the coach described';
}

function stageSteps(state) {
  const base = [
    { name: 'refine_prompt',  label: 'Refining coach inputs into Seedance prompt (LLM)' },
    { name: 'generate_video', label: 'Generating regenerated clip (Seedance 2.0)' },
    { name: 'finalise',       label: 'Encoding & finalising' },
  ];
  if (state === 'failed')    return base.map((s) => ({ ...s, status: 'pending' }));
  if (state === 'completed') return base.map((s) => ({ ...s, status: 'completed' }));
  // Refine happens server-side before /generate returns, so it's already done.
  return base.map((s, i) => ({ ...s, status: i === 0 ? 'completed' : i === 1 ? 'running' : 'pending' }));
}

function runMockJob(job_id) {
  const job = jobs[job_id];
  let i = 0;
  const tick = () => {
    if (i >= job.steps.length) {
      job.state = 'completed';
      job.completed_at = Date.now();
      job.result = mockAnalysisResult();
      return;
    }
    job.steps[i].status = 'running';
    job.steps[i].started_at = Date.now();
    setTimeout(() => {
      job.steps[i].status = 'completed';
      job.steps[i].completed_at = Date.now();
      i++;
      tick();
    }, job.steps[i].duration);
  };
  tick();
}

// ─── Status ────────────────────────────────────────────────────────────────
export async function getStatus(job_id) {
  const job = jobs[job_id];
  if (!job) {
    await sleep(80);
    return { state: 'unknown' };
  }

  if (job.kind === 'generate') {
    const elapsed = Date.now() - job.started;
    try {
      const r = await fetch(`${BACKEND_URL}/status/${encodeURIComponent(job_id)}`);
      let data;
      try { data = await r.json(); }
      catch { throw new Error(`status ${r.status}: response was not JSON`); }
      if (!r.ok) throw new Error(`status ${r.status}: ${data.detail || JSON.stringify(data)}`);

      const status = (data.status || '').toLowerCase();
      let progress = Math.min(0.95, 0.10 + (elapsed / 90_000) * 0.85);
      console.log(`[poll ${Math.round(elapsed/1000)}s] task=${job_id} status=${status || '(empty)'}`);

      if (status === 'succeeded') {
        progress = 1;
        job.state = 'completed';
        job.steps = stageSteps('completed');
        job.result = {
          regenerated_url: data.generated_video_url,
          refined_prompt: data.refined_prompt || job.refined_prompt,
          duration_s: 5,
        };
        console.log('[poll] succeeded; video_url=', data.generated_video_url);
      } else if (status === 'failed' || status === 'cancelled' || status === 'canceled') {
        job.state = 'failed';
        job.steps = stageSteps('failed');
        job.error = (data.error && (data.error.message || JSON.stringify(data.error))) || 'Generation failed';
        console.warn('[poll] failed:', job.error);
      } else {
        job.state = 'running';
        job.steps = stageSteps('running');
      }

      return {
        job_id,
        state: job.state,
        progress,
        steps: job.steps.map((s) => ({ name: s.name, label: s.label, status: s.status })),
        result: job.result || null,
        error: job.error || null,
      };
    } catch (err) {
      console.error(`[poll ${Math.round(elapsed/1000)}s] FAILED:`, err);
      // Don't permanently fail the job on a single transient network error —
      // keep state running so the screen can recover on the next poll. The
      // loader will show a small error footnote via the returned `pollError`.
      return {
        job_id,
        state: job.state || 'running',
        progress: Math.min(0.10, (elapsed / 90_000) * 0.85),
        steps: stageSteps('running'),
        result: null,
        pollError: err.message,
      };
    }
  }

  if (job.kind === 'generate-failed') {
    return {
      job_id, state: 'failed', progress: 0,
      steps: job.steps.map((s) => ({ name: s.name, label: s.label, status: s.status })),
      result: null, error: job.error,
    };
  }

  // Mock analyse job.
  await sleep(80);
  const totalMs   = job.steps.reduce((a, s) => a + (s.duration || 0), 0) || 1;
  const elapsedMs = job.steps.filter((s) => s.status === 'completed').reduce((a, s) => a + (s.duration || 0), 0)
    + (job.steps.find((s) => s.status === 'running')
        ? Math.min(Date.now() - (job.steps.find((s) => s.status === 'running').started_at || Date.now()),
                   job.steps.find((s) => s.status === 'running').duration)
        : 0);
  return {
    job_id,
    state: job.state || 'running',
    progress: Math.min(1, elapsedMs / totalMs),
    steps: job.steps.map((s) => ({ name: s.name, label: s.label, status: s.status })),
    result: job.result || null,
  };
}

function mockAnalysisResult() {
  return {
    summary:
      "Your clip's loaded. Scrub through, mark up anything you want changed (draw arrows, drop pins, " +
      "or add notes to specific moments) and write what you want different in the prompt below. " +
      "Replay will regenerate a corrected version of the clip.",
  };
}
