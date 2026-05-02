// Stage 1 Analyse screen.
// Stripped of all Roboflow-dependent UI:
//   - no player handles overlay
//   - no per-player side panel / drag-to-set From-To
//   - no flags-by-player list
// What remains: video + scrubber + annotation tools (draw / pin / note),
// global prompt, regenerate. Coach corrections come from globalPrompt
// + annotations only.

import { useEffect, useRef, useState } from 'react';
import { theme, kicker, btnSolid, btnGhost, formatTime } from '../lib/theme';
import { useStore, setState as storeSet } from '../lib/store';
import { useRoute, navigate } from '../lib/router';
import * as api from '../lib/api';
import VideoStage from '../components/VideoStage';
import Scrubber from '../components/Scrubber';
import AnnotationLayer from '../components/AnnotationLayer';
import AnnotationToolbar from '../components/AnnotationToolbar';
import RugbyLoader from '../components/RugbyLoader';

export default function AnalyseScreen() {
  const t = theme;
  const [state] = useStore();
  const video = state.video;
  const [job, setJob] = useState(null);

  useEffect(() => {
    if (!video) { navigate('/upload'); return; }
    if (state.analysis) return;
    let cancelled = false;
    (async () => {
      const { job_id } = await api.analyseVideo(video.video_id);
      const poll = async () => {
        const s = await api.getStatus(job_id);
        if (cancelled) return;
        setJob(s);
        if (s.state === 'completed') {
          storeSet({ analysis: s.result });
        } else if (s.state === 'failed') {
          // Bail and surface the error in the loader card.
        } else {
          setTimeout(poll, 500);
        }
      };
      poll();
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line

  if (!video) return null;
  if (!state.analysis) {
    const failed = job?.state === 'failed';
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          background: t.bgRaised, borderRadius: t.radiusLg, padding: 32,
          boxShadow: t.shadow, minWidth: 460, maxWidth: 640,
        }}>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={kicker(t)}>{failed ? 'Phase 2 · Failed' : 'Phase 2 · Loading'}</div>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: '6px 0 0', letterSpacing: '-0.01em' }}>
              {failed ? 'Could not analyse the clip' : 'Loading the clip'}
            </h2>
          </div>
          <RugbyLoader steps={job?.steps || []} progress={job?.progress || 0} />
          {failed && (
            <>
              <pre style={{
                marginTop: 14, padding: '10px 12px', background: t.bgInset,
                borderRadius: t.radiusSm, fontFamily: t.fontMono, fontSize: 11,
                color: t.red, lineHeight: 1.4, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>{job?.error || job?.result?.summary}</pre>
              <div style={{ marginTop: 14, display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button
                  onClick={() => { storeSet({ analysis: null }); window.location.reload(); }}
                  style={{ ...btnGhost(t) }}
                >Retry</button>
                <button
                  onClick={() => { storeSet({ video: null, analysis: null, generation: null, annotations: [] }); navigate('/upload'); }}
                  style={{ ...btnSolid(t) }}
                >Start over</button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return <AnalyseLoaded video={video} analysis={state.analysis} />;
}

function AnalyseLoaded({ video, analysis }) {
  const t = theme;
  const [state] = useStore();
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(video.duration || 0);
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);

  const [tool, setTool] = useState(null);
  const [drafting, setDrafting] = useState(null);

  // Read true duration from the loaded video.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onMeta = () => setDuration(v.duration || video.duration || 0);
    v.addEventListener('loadedmetadata', onMeta);
    return () => v.removeEventListener('loadedmetadata', onMeta);
  }, []);

  useEffect(() => {
    let raf;
    const tick = () => {
      const v = videoRef.current;
      if (v && !v.paused) setTime(v.currentTime);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else          { v.pause(); setPlaying(false); }
  };
  const seek = (s) => {
    setTime(s);
    if (videoRef.current) videoRef.current.currentTime = s;
  };

  // Annotations attach to the input clip (side: 'input').
  const inputAnnotations = state.annotations.filter((a) => (a.side || 'input') === 'input');
  const visibleAnnotations = inputAnnotations.filter((a) => Math.abs(a.t - time) < 1.5);

  const addAnnotation = (a) => storeSet((s) => ({ ...s, annotations: [...s.annotations, a] }));
  const removeAnnotation = (id) => storeSet((s) => ({ ...s, annotations: s.annotations.filter((a) => a.id !== id) }));

  const overlayHandlers = {
    onMouseDown: (e) => {
      if (!tool) return;
      const rect = overlayRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top)  / rect.height;
      if (tool === 'draw') {
        setDrafting({ id: 'an_' + Math.random().toString(36).slice(2,8),
          side: 'input', type: 'draw', t: time, path: [[x, y]] });
      } else if (tool === 'pin') {
        addAnnotation({ id: 'an_' + Math.random().toString(36).slice(2,8),
          side: 'input', type: 'pin', t: time, x, y });
        setTool(null);
      } else if (tool === 'note') {
        const text = prompt('Note text:');
        if (text) addAnnotation({ id: 'an_' + Math.random().toString(36).slice(2,8),
          side: 'input', type: 'note', t: time, x, y, text });
        setTool(null);
      }
    },
    onMouseMove: (e) => {
      if (tool !== 'draw' || !drafting) return;
      const rect = overlayRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top)  / rect.height;
      setDrafting({ ...drafting, path: [...drafting.path, [x, y]] });
    },
    onMouseUp: () => {
      if (tool === 'draw' && drafting && drafting.path.length > 1) addAnnotation(drafting);
      if (drafting) setDrafting(null);
    },
  };

  const onRegenerate = async () => {
    setBusy(true);
    const { job_id } = await api.generateVideo(state.globalPrompt, inputAnnotations);
    navigate('/generate/' + job_id);
  };

  const markers = inputAnnotations.map((a) => ({ t: a.t, label: a.type }));

  return (
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '300px 1fr 320px',
      gap: 16, padding: '0 16px 16px', overflow: 'hidden' }}>

      {/* LEFT — context */}
      <aside style={{ padding: '4px 8px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={kicker(t)}>Clip</div>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>
          {video.filename}
        </h2>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: t.ink70 }}>
          {analysis.summary}
        </p>
        <div style={{
          fontSize: 10, fontFamily: t.fontMono, color: t.ink45, letterSpacing: '0.04em',
        }}>
          via Claude vision · Roboflow tracking soon
        </div>

        <div style={{
          marginTop: 8, padding: '12px 14px', background: t.bgRaised, borderRadius: t.radius,
          boxShadow: t.shadowFlat, fontSize: 12, color: t.ink55, lineHeight: 1.5,
        }}>
          <div style={{ ...kicker(t), color: t.ink45, marginBottom: 6 }}>Stage 2 · coming</div>
          Player tracking, per-player corrections, and tactical flags arrive when Roboflow's wired in.
          For now, mark up the clip and tell us what to change.
        </div>
      </aside>

      {/* CENTER — video + tools + prompt */}
      <main style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
        <div
          ref={overlayRef}
          {...overlayHandlers}
          style={{ flex: 1, position: 'relative', minHeight: 0, cursor: tool ? 'crosshair' : 'default' }}
        >
          <VideoStage
            videoRef={videoRef}
            videoUrl={video.url}
            time={time}
            duration={duration}
            label="ORIGINAL"
            childrenOverlay={
              <AnnotationLayer
                annotations={visibleAnnotations}
                drafting={drafting}
              />
            }
          />
        </div>

        <AnnotationToolbar tool={tool} setTool={setTool} count={inputAnnotations.length} />

        <Scrubber
          time={time} duration={duration} playing={playing}
          onPlayToggle={togglePlay} onSeek={seek}
          markers={markers}
        />

        <div style={{
          background: t.bgRaised, borderRadius: 12, padding: '12px 14px',
          boxShadow: t.shadowFlat,
        }}>
          <div style={{ ...kicker(t), marginBottom: 6 }}>For the whole clip</div>
          <textarea
            value={state.globalPrompt}
            onChange={(e) => storeSet({ globalPrompt: e.target.value })}
            rows={2}
            placeholder="What should be different in the regenerated version?"
            style={{
              width: '100%', resize: 'none', border: 'none', outline: 'none',
              background: 'transparent', fontFamily: t.fontUI,
              fontSize: 13, lineHeight: 1.5, color: t.ink, padding: 0,
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={() => { storeSet({ video: null, generation: null, analysis: null, annotations: [] }); navigate('/upload'); }}
            style={btnGhost(t)}>Start over</button>
          <button
            onClick={onRegenerate}
            disabled={busy || (!state.globalPrompt?.trim() && inputAnnotations.length === 0)}
            style={{
              ...btnSolid(t),
              background: busy ? t.ink25 : t.red,
              cursor: busy ? 'not-allowed' : 'pointer',
              padding: '10px 18px', fontSize: 13,
            }}
          >{busy ? 'Submitting…' : 'Regenerate clip ↗'}</button>
        </div>
      </main>

      {/* RIGHT — annotations list */}
      <aside style={{
        background: t.bgRaised, borderRadius: t.radiusLg,
        padding: 18, display: 'flex', flexDirection: 'column', gap: 14,
        boxShadow: t.shadow, overflow: 'auto',
      }}>
        <div style={kicker(t)}>Annotations on this clip</div>
        {inputAnnotations.length === 0 && (
          <div style={{ fontSize: 12, color: t.ink55, lineHeight: 1.5 }}>
            Pick a tool above and click on the clip to drop arrows, pins, or notes.
            Notes are sent to the regenerator alongside your prompt.
          </div>
        )}
        {inputAnnotations.map((a) => (
          <div key={a.id} style={{
            padding: '8px 0', borderBottom: `1px solid ${t.ink06}`,
            fontSize: 12, display: 'flex', justifyContent: 'space-between', gap: 8,
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{a.type}</span>
              </div>
              <div style={{ color: t.ink55, fontFamily: t.fontMono, fontSize: 10, marginTop: 2 }}>
                {formatTime(a.t)}
              </div>
              {a.text && <div style={{ color: t.ink70, marginTop: 4 }}>{a.text}</div>}
            </div>
            <button onClick={() => removeAnnotation(a.id)}
              style={{ background: 'none', border: 'none',
                color: t.ink45, cursor: 'pointer', fontSize: 14, padding: 0 }}>×</button>
          </div>
        ))}
      </aside>
    </div>
  );
}
