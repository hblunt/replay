// lib/api.js — API layer.
// Stage 1: /generate is REAL (FastAPI → LLM refine → Seedance vedit).
// /upload + /analyse remain mocked (Roboflow tracking is Stage 2).
//
// Real backend endpoints (Stage 1):
//   POST /generate  body: { video_url, coach_prompt }
//                   → { task_id, refined_prompt, video_url }
//   GET  /status/:task_id
//                   → { task_id, status, generated_video_url, refined_prompt, error, raw }

(function () {
  const BACKEND_URL = 'http://localhost:8000';

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const uid = () => Math.random().toString(36).slice(2, 10);

  // In-memory job registry. Mocked jobs run their fake timeline here;
  // real jobs (generate) cache the polled state so getStatus is consistent.
  const jobs = {};

  // ─── Upload (MOCK in Stage 1) ────────────────────────────────────────────
  async function uploadVideo(file, focusPrompt) {
    await sleep(400);
    const video_id = 'vid_' + uid();
    return {
      video_id,
      filename: file?.name || 'sample_clip.mp4',
      duration: 9.4,
      size_bytes: file?.size || 12_400_000,
      uploaded_at: new Date().toISOString(),
      focus_prompt: focusPrompt || null,
    };
  }

  // ─── Analyse (MOCK in Stage 1) ───────────────────────────────────────────
  async function analyseVideo(video_id) {
    await sleep(150);
    const job_id = 'job_' + uid();
    jobs[job_id] = {
      kind: 'analyse',
      video_id,
      started: Date.now(),
      steps: [
        { name: 'extract_frames',  label: 'Extracting frames at 5fps',           status: 'pending', duration: 1200 },
        { name: 'detect_players',  label: 'Tracking players & ball (Roboflow)',  status: 'pending', duration: 2000 },
        { name: 'analyse_tactics', label: 'Generating tactical summary (LLM)',   status: 'pending', duration: 1400 },
      ],
    };
    runMockJob(job_id);
    return { job_id };
  }

  // ─── Generate (REAL in Stage 1) ──────────────────────────────────────────
  // correctionState: { corrections: [{playerId, frameTime, fromX/Y, toX/Y, note}], globalPrompt }
  async function generateVideo(video_id, correctionState) {
    const state = window.store.get();
    const video_url = state.video?.url || window.SAMPLE_VIDEO_URL;
    const coach_prompt = synthesiseCoachPrompt(correctionState);

    let res;
    try {
      const r = await fetch(`${BACKEND_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_url, coach_prompt }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || JSON.stringify(data));
      res = data; // { task_id, refined_prompt, video_url }
    } catch (err) {
      // Surface as a failed job so the UI shows it instead of spinning forever.
      const job_id = 'job_' + uid();
      jobs[job_id] = {
        kind: 'generate-failed',
        video_id,
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
      video_id,
      coach_prompt,
      refined_prompt: res.refined_prompt,
      video_url,
      started: Date.now(),
      // Two-step rendition for the loader. Refine is already done by the time
      // we get here (it happens server-side before /generate returns), so we
      // mark it complete and only the Seedance step is "running".
      steps: [
        { name: 'refine_prompt',  label: 'Refining coach inputs into Seedance prompt (LLM)', status: 'completed' },
        { name: 'generate_video', label: 'Generating regenerated clip (Seedance 2.0)',       status: 'running' },
        { name: 'finalise',       label: 'Encoding & finalising',                              status: 'pending' },
      ],
      state: 'running',
    };
    return { job_id };
  }

  function synthesiseCoachPrompt({ corrections = [], globalPrompt = '' } = {}) {
    const parts = [];
    if (globalPrompt && globalPrompt.trim()) parts.push(globalPrompt.trim());
    for (const c of corrections) {
      const player = (window.MOCK_PLAYERS || []).find((p) => p.id === c.playerId);
      const who = player ? `the ${player.side === 'home' ? 'home' : 'away'} ${player.role.toLowerCase()} (#${c.playerId})`
                         : `player #${c.playerId}`;
      const note = (c.note && c.note.trim()) ? c.note.trim() : 'should reposition as marked';
      parts.push(`${who}: ${note}`);
    }
    return parts.join('. ') || 'modify the play as shown';
  }

  function stageSteps(state) {
    const base = [
      { name: 'refine_prompt',  label: 'Refining coach inputs into Seedance prompt (LLM)' },
      { name: 'generate_video', label: 'Generating regenerated clip (Seedance 2.0)' },
      { name: 'finalise',       label: 'Encoding & finalising' },
    ];
    if (state === 'failed') return base.map((s) => ({ ...s, status: 'pending' }));
    if (state === 'completed') return base.map((s) => ({ ...s, status: 'completed' }));
    return base.map((s, i) => ({ ...s, status: i === 0 ? 'completed' : i === 1 ? 'running' : 'pending' }));
  }

  // ─── Mock job runner (used only for analyse) ─────────────────────────────
  function runMockJob(job_id) {
    const job = jobs[job_id];
    let i = 0;
    const tick = () => {
      if (i >= job.steps.length) {
        job.state = 'completed';
        job.completed_at = Date.now();
        job.result = mockAnalysisResult(job.video_id);
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

  // ─── Status (real for generate, mock for analyse) ────────────────────────
  async function getStatus(job_id) {
    const job = jobs[job_id];
    if (!job) {
      await sleep(80);
      return { state: 'unknown' };
    }

    if (job.kind === 'generate') {
      // Hit real backend.
      try {
        const r = await fetch(`${BACKEND_URL}/status/${encodeURIComponent(job_id)}`);
        const data = await r.json();
        if (!r.ok) throw new Error(data.detail || JSON.stringify(data));

        const status = (data.status || '').toLowerCase();
        const elapsed = Date.now() - job.started;
        // Crude progress estimate: assume Seedance takes ~90s. Cap at 0.95 until succeeded.
        let progress = Math.min(0.95, 0.10 + (elapsed / 90_000) * 0.85);

        if (status === 'succeeded') {
          progress = 1;
          job.state = 'completed';
          job.steps = stageSteps('completed');
          job.result = {
            video_id: job.video_id,
            regenerated_url: data.generated_video_url,
            refined_prompt: data.refined_prompt || job.refined_prompt,
            duration_s: 5,
          };
        } else if (status === 'failed' || status === 'cancelled' || status === 'canceled') {
          job.state = 'failed';
          job.steps = stageSteps('failed');
          job.error = (data.error && (data.error.message || JSON.stringify(data.error))) || 'Generation failed';
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
        return {
          job_id,
          state: 'failed',
          progress: 0,
          steps: stageSteps('failed'),
          result: null,
          error: 'Status poll failed: ' + err.message,
        };
      }
    }

    if (job.kind === 'generate-failed') {
      return {
        job_id,
        state: 'failed',
        progress: 0,
        steps: job.steps.map((s) => ({ name: s.name, label: s.label, status: s.status })),
        result: null,
        error: job.error,
      };
    }

    // Mock analyse job — original mock behaviour.
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

  // ─── Mock results (analyse only) ─────────────────────────────────────────
  function mockAnalysisResult(video_id) {
    return {
      video_id,
      summary:
        "The scrum is complete and #9 has picked up the ball. Eight defenders are forming a line at +5m. " +
        "The right wing (#7) sits 4.2m behind the line and does not push up when the fly-half receives. " +
        "The left wing (#14) is similarly drifting. Line speed measured 2.1 m/s, well under league average.",
      tracked: { players: 12, ball: 1, frames: 47 },
      players: window.MOCK_PLAYERS,
      tracks:  window.MOCK_TRACKS,
      flags: [
        { player: 7,  text: '#7 is 1.6m deeper than expected at the trigger frame.' },
        { player: 14, text: '#14 holds depth too long after the scrum completes.' },
      ],
    };
  }

  // ─── Public API ──────────────────────────────────────────────────────────
  window.api = {
    uploadVideo,
    analyseVideo,
    generateVideo,
    getStatus,
    BACKEND_URL,
  };
})();
