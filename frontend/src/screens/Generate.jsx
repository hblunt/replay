import { useEffect, useRef, useState } from 'react';
import { theme, kicker, btnSolid, btnGhost, formatTime } from '../lib/theme';
import { useStore, setState as storeSet, resetState } from '../lib/store';
import { useRoute, navigate } from '../lib/router';
import * as api from '../lib/api';
import VideoStage from '../components/VideoStage';
import Scrubber from '../components/Scrubber';
import AnnotationLayer from '../components/AnnotationLayer';
import AnnotationToolbar from '../components/AnnotationToolbar';
import RugbyLoader from '../components/RugbyLoader';

export default function GenerateScreen() {
  const t = theme;
  const route = useRoute();
  const job_id = route.param;
  const [state] = useStore();
  const video = state.video;
  const [job, setJob] = useState(null);

  useEffect(() => {
    if (!video) { navigate('/upload'); return; }
    if (state.generation) return;
    if (!job_id) { navigate('/analyse'); return; }
    let cancelled = false;
    const poll = async () => {
      const s = await api.getStatus(job_id);
      if (cancelled) return;
      setJob(s);
      if (s.state === 'completed') storeSet({ generation: s.result });
      else if (s.state !== 'failed') setTimeout(poll, 2500);
    };
    poll();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line

  if (!video) return null;

  if (job?.state === 'failed') {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{
          background: t.bgRaised, borderRadius: t.radiusLg, padding: 28,
          boxShadow: t.shadow, maxWidth: 640,
        }}>
          <div style={kicker(t)}>Phase 3 · Failed</div>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: '6px 0 12px' }}>The generation failed</h2>
          <pre style={{
            fontFamily: t.fontMono, fontSize: 11, lineHeight: 1.5,
            background: t.bgInset, padding: 12, borderRadius: t.radiusSm,
            color: t.ink70, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>{job.error}</pre>
          <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
            <button onClick={() => navigate('/analyse')} style={btnGhost(t)}>Back to clip</button>
            <button onClick={() => { resetState(); navigate('/upload'); }} style={btnSolid(t)}>Start over</button>
          </div>
        </div>
      </div>
    );
  }

  if (!state.generation) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          background: t.bgRaised, borderRadius: t.radiusLg, padding: 32,
          boxShadow: t.shadow, minWidth: 460,
        }}>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={kicker(t)}>Phase 3 · Regenerating</div>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: '6px 0 0', letterSpacing: '-0.01em' }}>
              Building the corrected clip
            </h2>
            <div style={{ fontSize: 11, color: t.ink55, fontFamily: t.fontMono, marginTop: 6 }}>
              task <code>{job_id}</code>
            </div>
          </div>
          <RugbyLoader steps={job?.steps || []} progress={job?.progress || 0} />
          {job?.pollError && (
            <div style={{
              marginTop: 12, padding: '10px 12px', background: t.bgInset,
              borderRadius: t.radiusSm, fontFamily: t.fontMono, fontSize: 11,
              color: t.red, lineHeight: 1.4,
            }}>
              ⚠ Last poll failed — retrying. {job.pollError}
            </div>
          )}
        </div>
      </div>
    );
  }

  return <GenerateLoaded />;
}

function GenerateLoaded() {
  const t = theme;
  const [state] = useStore();
  const { video, generation } = state;

  const origRef = useRef(null);
  const newRef  = useRef(null);

  // Per-side state — each video keeps its own playhead even after switching.
  const [origTime, setOrigTime] = useState(0);
  const [newTime,  setNewTime]  = useState(0);
  const [origDuration, setOrigDuration] = useState(0);
  const [newDuration,  setNewDuration]  = useState(generation.duration_s || 0);
  const [origPlaying, setOrigPlaying] = useState(false);
  const [newPlaying,  setNewPlaying]  = useState(false);

  // Which clip is currently driving the controls.
  const [selectedSide, setSelectedSide] = useState('orig');
  const isOrig    = selectedSide === 'orig';
  const time      = isOrig ? origTime : newTime;
  const duration  = isOrig ? origDuration : newDuration;
  const playing   = isOrig ? origPlaying : newPlaying;

  // Wire metadata + play/pause events for both videos. Time is read each RAF
  // while playing (avoids 60Hz state-spam when paused).
  useEffect(() => {
    const a = origRef.current, b = newRef.current;
    if (!a || !b) return;
    const onMetaA = () => setOrigDuration(a.duration || 0);
    const onMetaB = () => setNewDuration(b.duration || 0);
    const onPlayA = () => setOrigPlaying(true);
    const onPauseA = () => setOrigPlaying(false);
    const onPlayB = () => setNewPlaying(true);
    const onPauseB = () => setNewPlaying(false);
    a.addEventListener('loadedmetadata', onMetaA);
    b.addEventListener('loadedmetadata', onMetaB);
    a.addEventListener('play', onPlayA);
    a.addEventListener('pause', onPauseA);
    b.addEventListener('play', onPlayB);
    b.addEventListener('pause', onPauseB);
    return () => {
      a.removeEventListener('loadedmetadata', onMetaA);
      b.removeEventListener('loadedmetadata', onMetaB);
      a.removeEventListener('play', onPlayA);
      a.removeEventListener('pause', onPauseA);
      b.removeEventListener('play', onPlayB);
      b.removeEventListener('pause', onPauseB);
    };
  }, []);

  useEffect(() => {
    let raf;
    const tick = () => {
      const a = origRef.current, b = newRef.current;
      if (a && !a.paused) setOrigTime(a.currentTime);
      if (b && !b.paused) setNewTime(b.currentTime);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const switchSide = (side) => {
    if (side === selectedSide) return;
    // Pause both on side-switch so the previous clip's playhead freezes.
    if (origRef.current && !origRef.current.paused) origRef.current.pause();
    if (newRef.current  && !newRef.current.paused)  newRef.current.pause();
    setSelectedSide(side);
  };

  const togglePlay = () => {
    const v = isOrig ? origRef.current : newRef.current;
    const other = isOrig ? newRef.current : origRef.current;
    if (!v) return;
    if (other && !other.paused) other.pause();
    if (v.paused) v.play();
    else v.pause();
  };

  const seek = (s) => {
    const v = isOrig ? origRef.current : newRef.current;
    if (!v) return;
    v.currentTime = s;
    if (isOrig) setOrigTime(s);
    else setNewTime(s);
  };

  const [tool, setTool] = useState(null);
  const [drafting, setDrafting] = useState(null);
  const origOverlayRef = useRef(null);
  const newOverlayRef = useRef(null);

  const makeHandlers = (side, ref) => ({
    onMouseDown: (e) => {
      switchSide(side);
      if (!tool) return;
      const rect = ref.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top)  / rect.height;
      const tNow = side === 'orig' ? origTime : newTime;
      if (tool === 'draw') {
        setDrafting({ id: 'an_' + Math.random().toString(36).slice(2,8),
          side, type: 'draw', t: tNow, path: [[x, y]] });
      } else if (tool === 'pin') {
        addAnnotation({ id: 'an_' + Math.random().toString(36).slice(2,8),
          side, type: 'pin', t: tNow, x, y });
        setTool(null);
      } else if (tool === 'note') {
        const text = prompt('Note text:');
        if (text) addAnnotation({ id: 'an_' + Math.random().toString(36).slice(2,8),
          side, type: 'note', t: tNow, x, y, text });
        setTool(null);
      }
    },
    onMouseMove: (e) => {
      if (tool !== 'draw' || !drafting || drafting.side !== side) return;
      const rect = ref.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top)  / rect.height;
      setDrafting({ ...drafting, path: [...drafting.path, [x, y]] });
    },
    onMouseUp: () => {
      if (tool === 'draw' && drafting && drafting.side === side && drafting.path.length > 1) addAnnotation(drafting);
      if (drafting && drafting.side === side) setDrafting(null);
    },
  });
  const origHandlers = makeHandlers('orig', origOverlayRef);
  const newHandlers  = makeHandlers('new',  newOverlayRef);

  const addAnnotation = (a) => storeSet((s) => ({ ...s, annotations: [...s.annotations, a] }));
  const removeAnnotation = (id) => storeSet((s) => ({ ...s, annotations: s.annotations.filter((a) => a.id !== id) }));

  // Annotations on each clip are anchored to that clip's time, so filter by
  // whichever side they belong to using its own playhead.
  const visibleOrig = state.annotations.filter(
    (a) => (a.side || 'new') === 'orig' && Math.abs(a.t - origTime) < 1.5
  );
  const visibleNew = state.annotations.filter(
    (a) => (a.side || 'new') === 'new' && Math.abs(a.t - newTime) < 1.5
  );

  // Scrubber markers: only the selected side's annotations.
  const selectedAnnotations = state.annotations.filter(
    (a) => (a.side || 'new') === selectedSide
  );

  const selectedOutline = `3px solid ${t.red}`;
  const idleOutline = `3px solid transparent`;

  return (
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 320px',
      gap: 16, padding: '0 16px 16px', overflow: 'hidden' }}>
      <main style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
        <div style={{ flex: 1, minHeight: 0, display: 'grid',
          gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div
            ref={origOverlayRef}
            {...origHandlers}
            style={{
              position: 'relative',
              cursor: tool ? 'crosshair' : 'pointer',
              outline: isOrig ? selectedOutline : idleOutline,
              outlineOffset: 0,
              borderRadius: t.radiusLg,
              transition: 'outline-color 0.15s',
            }}
          >
            <VideoStage
              videoRef={origRef}
              videoUrl={video.url}
              time={origTime} duration={origDuration}
              label="ORIGINAL"
              childrenOverlay={<AnnotationLayer annotations={visibleOrig} drafting={drafting && drafting.side === 'orig' ? drafting : null} />}
            />
          </div>
          <div
            ref={newOverlayRef}
            {...newHandlers}
            style={{
              position: 'relative',
              cursor: tool ? 'crosshair' : 'pointer',
              outline: !isOrig ? selectedOutline : idleOutline,
              outlineOffset: 0,
              borderRadius: t.radiusLg,
              transition: 'outline-color 0.15s',
            }}
          >
            <VideoStage
              videoRef={newRef}
              videoUrl={generation.regenerated_url}
              time={newTime} duration={newDuration}
              watermark="REGENERATED"
              childrenOverlay={<AnnotationLayer annotations={visibleNew} drafting={drafting && drafting.side === 'new' ? drafting : null} />}
            />
          </div>
        </div>

        <AnnotationToolbar tool={tool} setTool={setTool} count={state.annotations.length} />

        <Scrubber
          time={time} duration={duration} playing={playing}
          onPlayToggle={togglePlay} onSeek={seek}
          markers={selectedAnnotations.map((a) => ({ t: a.t, label: a.type }))}
        />
        <div style={{
          fontSize: 11, fontFamily: t.fontMono, color: t.ink55,
          letterSpacing: '0.04em', textAlign: 'center', marginTop: -4,
        }}>
          controls drive the <span style={{ color: t.red, fontWeight: 600 }}>{isOrig ? 'ORIGINAL' : 'REGENERATED'}</span> clip · click the other to switch
        </div>
      </main>

      <aside style={{
        background: t.bgRaised, borderRadius: t.radiusLg,
        padding: 18, display: 'flex', flexDirection: 'column', gap: 14,
        boxShadow: t.shadow, overflow: 'auto',
      }}>
        <div>
          <div style={kicker(t)}>Refined prompt (Seedance)</div>
          <div style={{
            background: t.bgInset, borderRadius: t.radiusSm,
            padding: 12, marginTop: 6,
            fontFamily: t.fontMono, fontSize: 11, lineHeight: 1.55, color: t.ink70,
            maxHeight: 240, overflow: 'auto', whiteSpace: 'pre-wrap',
          }}>
            {generation.refined_prompt}
          </div>
        </div>

        <div>
          <div style={kicker(t)}>Annotations</div>
          {state.annotations.length === 0 && (
            <div style={{ fontSize: 12, color: t.ink55, marginTop: 6, lineHeight: 1.5 }}>
              Pick a tool and click on either clip to annotate.
            </div>
          )}
          {state.annotations.map((a) => {
            const side = a.side || 'new';
            return (
              <div key={a.id} style={{
                padding: '8px 0', borderBottom: `1px solid ${t.ink06}`,
                fontSize: 12, display: 'flex', justifyContent: 'space-between', gap: 8,
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontSize: 9, fontFamily: t.fontMono, letterSpacing: '0.06em',
                      padding: '2px 5px', borderRadius: 3,
                      background: side === 'orig' || side === 'input' ? t.ink10 : t.red,
                      color: side === 'orig' || side === 'input' ? t.ink70 : '#fff',
                    }}>{(side === 'orig' || side === 'input') ? 'ORIG' : 'NEW'}</span>
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
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
          <button onClick={() => navigate('/analyse')}
            style={{ ...btnGhost(t), flex: 1 }}>Back to clip</button>
          <button onClick={() => { resetState(); navigate('/upload'); }}
            style={{ ...btnSolid(t), flex: 1 }}>New clip</button>
        </div>
      </aside>
    </div>
  );
}
