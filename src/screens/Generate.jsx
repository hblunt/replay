// screens/Generate.jsx — Phase 3: side-by-side player + annotation tools.

function GenerateScreen() {
  const t = window.theme;
  const route = window.useRoute();
  const job_id = route.param;
  const [state, setState] = window.useStore();
  const video = state.video;
  const [job, setJob] = React.useState(null);

  // Poll until generation completes.
  React.useEffect(() => {
    if (!video) { window.navigate('/upload'); return; }
    if (state.generation) return;
    if (!job_id) { window.navigate('/analyse'); return; }
    let cancelled = false;
    const poll = async () => {
      const s = await window.api.getStatus(job_id);
      if (cancelled) return;
      setJob(s);
      if (s.state === 'completed') setState({ generation: s.result });
      else setTimeout(poll, 250);
    };
    poll();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line

  if (!video) return null;
  if (!state.generation) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          background: t.bgRaised, borderRadius: t.radiusLg, padding: 32,
          boxShadow: t.shadow, minWidth: 460,
        }}>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={window._kicker(t)}>Phase 3 · Regenerating</div>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: '6px 0 0', letterSpacing: '-0.01em' }}>
              Building the corrected clip
            </h2>
          </div>
          <window.RugbyLoader steps={job?.steps || []} progress={job?.progress || 0} />
        </div>
      </div>
    );
  }

  return <GenerateLoaded />;
}

function GenerateLoaded() {
  const t = window.theme;
  const [state, setState] = window.useStore();
  const { video, generation } = state;
  const duration = generation.duration_s || video.duration || 9.4;

  const origRef = React.useRef(null);
  const newRef  = React.useRef(null);
  const [time, setTime] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);

  // Sync both videos to a shared time.
  React.useEffect(() => {
    let raf;
    const tick = () => {
      const v = newRef.current;
      if (v && !v.paused) {
        setTime(v.currentTime);
        if (origRef.current) origRef.current.currentTime = v.currentTime;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const togglePlay = () => {
    const a = origRef.current, b = newRef.current;
    if (!a || !b) return;
    if (b.paused) { a.play(); b.play(); setPlaying(true); }
    else          { a.pause(); b.pause(); setPlaying(false); }
  };
  const seek = (s) => {
    setTime(s);
    if (origRef.current) origRef.current.currentTime = s;
    if (newRef.current)  newRef.current.currentTime  = s;
  };

  // ─── Annotation tools ──────────────────────────────────────────────────
  // Each annotation now has `side: 'orig' | 'new'` so both clips can be marked up.
  const [tool, setTool] = React.useState(null); // 'draw'|'pin'|'note'|null
  const [drafting, setDrafting] = React.useState(null); // active draw path
  const origOverlayRef = React.useRef(null);
  const newOverlayRef = React.useRef(null);
  const [helpOpen, setHelpOpen] = React.useState(false);

  const makeOverlayHandlers = (side, ref) => ({
    onMouseDown: (e) => {
      if (!tool) return;
      const rect = ref.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top)  / rect.height;
      if (tool === 'draw') {
        setDrafting({ id: 'an_' + Math.random().toString(36).slice(2,8),
          side, type: 'draw', t: time, path: [[x, y]] });
      } else if (tool === 'pin') {
        addAnnotation({ id: 'an_' + Math.random().toString(36).slice(2,8),
          side, type: 'pin', t: time, x, y });
        setTool(null);
      } else if (tool === 'note') {
        const text = prompt('Note text:');
        if (text) addAnnotation({ id: 'an_' + Math.random().toString(36).slice(2,8),
          side, type: 'note', t: time, x, y, text });
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
      if (tool === 'draw' && drafting && drafting.side === side && drafting.path.length > 1) {
        addAnnotation(drafting);
      }
      if (drafting && drafting.side === side) setDrafting(null);
    },
  });
  const origHandlers = makeOverlayHandlers('orig', origOverlayRef);
  const newHandlers = makeOverlayHandlers('new', newOverlayRef);
  const addAnnotation = (a) =>
    setState((s) => ({ ...s, annotations: [...s.annotations, a] }));
  const removeAnnotation = (id) =>
    setState((s) => ({ ...s, annotations: s.annotations.filter((a) => a.id !== id) }));

  const visibleOrig = state.annotations.filter(
    (a) => (a.side || 'new') === 'orig' && Math.abs(a.t - time) < 1.5
  );
  const visibleNew = state.annotations.filter(
    (a) => (a.side || 'new') === 'new' && Math.abs(a.t - time) < 1.5
  );

  return (
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 320px',
      gap: 16, padding: '0 16px 16px', overflow: 'hidden' }}>
      <main style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
        {/* Side-by-side videos */}
        <div style={{ flex: 1, minHeight: 0, display: 'grid',
          gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ position: 'relative', cursor: tool ? 'crosshair' : 'default' }}
               ref={origOverlayRef} {...origHandlers}>
            <window.Pitch
              videoRef={origRef}
              videoUrl={video.url || window.SAMPLE_VIDEO_URL}
              time={time} duration={duration}
              corrections={[]}
              showOverlay={false}
              childrenOverlay={
                <AnnotationLayer
                  annotations={visibleOrig}
                  drafting={drafting && drafting.side === 'orig' ? drafting : null}
                  onRemove={removeAnnotation}
                />
              }
            />
            <div style={labelChip(t)}>ORIGINAL</div>
          </div>
          <div style={{ position: 'relative', cursor: tool ? 'crosshair' : 'default' }}
               ref={newOverlayRef} {...newHandlers}>
            <window.Pitch
              videoRef={newRef}
              videoUrl={generation.regenerated_url}
              time={time} duration={duration}
              corrections={state.corrections}
              showOverlay={false}
              watermark="REGENERATED"
              childrenOverlay={
                <AnnotationLayer
                  annotations={visibleNew}
                  drafting={drafting && drafting.side === 'new' ? drafting : null}
                  onRemove={removeAnnotation}
                />
              }
            />
            <div style={{ ...labelChip(t), background: t.red, color: '#fff' }}>NEW</div>
          </div>
        </div>

        {/* Annotation toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: t.bgRaised, padding: '8px 14px', borderRadius: 12,
          boxShadow: t.shadowFlat,
        }}>
          <span style={{ ...window._kicker(t), marginRight: 4 }}>Tools</span>
          <ToolButton active={tool === 'draw'} onClick={() => setTool(tool === 'draw' ? null : 'draw')}>
            ✎ Draw
          </ToolButton>
          <ToolButton active={tool === 'pin'} onClick={() => setTool(tool === 'pin' ? null : 'pin')}>
            ◉ Pin
          </ToolButton>
          <ToolButton active={tool === 'note'} onClick={() => setTool(tool === 'note' ? null : 'note')}>
            ✦ Note
          </ToolButton>
          <span style={{ fontSize: 11, color: t.ink55, marginLeft: 4 }}>
            {tool ? 'Click either clip to place' : 'Pick a tool, then click on either clip'}
          </span>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 11, fontFamily: t.fontMono, color: t.ink45 }}>
            {state.annotations.length} annotation{state.annotations.length === 1 ? '' : 's'}
          </span>
          <button onClick={() => setHelpOpen(true)}
            style={{ ...window._btnGhost(t), padding: '6px 10px', fontSize: 11 }}>
            How it works
          </button>
        </div>

        {helpOpen && <HowItWorksModal onClose={() => setHelpOpen(false)} />}

        <window.Scrubber
          time={time} duration={duration} playing={playing}
          onPlayToggle={togglePlay} onSeek={seek}
          markers={state.annotations.map((a) => ({ t: a.t, label: (a.side || 'new') + ':' + a.type }))}
        />
      </main>

      {/* Right rail — refined prompt + annotations list */}
      <aside style={{
        background: t.bgRaised, borderRadius: t.radiusLg,
        padding: 18, display: 'flex', flexDirection: 'column', gap: 14,
        boxShadow: t.shadow, overflow: 'auto',
      }}>
        <div>
          <div style={window._kicker(t)}>Refined prompt (Seedance)</div>
          <div style={{
            background: t.bgInset, borderRadius: t.radiusSm,
            padding: 12, marginTop: 6,
            fontFamily: t.fontMono, fontSize: 11, lineHeight: 1.55, color: t.ink70,
            maxHeight: 200, overflow: 'auto',
          }}>
            {generation.refined_prompt}
          </div>
        </div>

        <div>
          <div style={window._kicker(t)}>Annotations</div>
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
                    background: side === 'orig' ? t.ink10 : t.red,
                    color: side === 'orig' ? t.ink70 : '#fff',
                  }}>{side === 'orig' ? 'ORIG' : 'NEW'}</span>
                  <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{a.type}</span>
                </div>
                <div style={{ color: t.ink55, fontFamily: t.fontMono, fontSize: 10, marginTop: 2 }}>
                  {window.formatTime(a.t)}
                </div>
                {a.text && <div style={{ color: t.ink70, marginTop: 4 }}>{a.text}</div>}
              </div>
              <button onClick={() => removeAnnotation(a.id)}
                style={{ background: 'none', border: 'none',
                  color: t.ink45, cursor: 'pointer', fontSize: 14, padding: 0 }}>×</button>
            </div>
          );})}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
          <button onClick={() => window.navigate('/analyse')}
            style={{ ...window._btnGhost(t), flex: 1 }}>Back to analyse</button>
          <button onClick={() => { window.store.reset(); window.navigate('/upload'); }}
            style={{ ...window._btnSolid(t), flex: 1 }}>New clip</button>
        </div>
      </aside>
    </div>
  );
}

function ToolButton({ active, children, onClick }) {
  const t = window.theme;
  return (
    <button onClick={onClick} style={{
      padding: '6px 10px', borderRadius: 6, fontSize: 12, fontFamily: t.fontUI,
      background: active ? t.ink : 'transparent',
      color: active ? t.bg : t.ink,
      border: `1px solid ${active ? t.ink : t.ink10}`,
      cursor: 'pointer',
    }}>{children}</button>
  );
}

function AnnotationLayer({ annotations, drafting, onRemove }) {
  const t = window.theme;
  return (
    <>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
           viewBox="0 0 100 56" preserveAspectRatio="none">
        {annotations.filter((a) => a.type === 'draw').map((a) => (
          <polyline key={a.id}
            points={a.path.map(([x, y]) => `${x*100},${y*56}`).join(' ')}
            fill="none" stroke={t.red} strokeWidth="0.5"
            strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {drafting && (
          <polyline
            points={drafting.path.map(([x, y]) => `${x*100},${y*56}`).join(' ')}
            fill="none" stroke={t.red} strokeWidth="0.5"
            strokeLinecap="round" strokeLinejoin="round"
            opacity="0.7" />
        )}
      </svg>
      {annotations.filter((a) => a.type === 'pin').map((a) => (
        <div key={a.id}
          style={{
            position: 'absolute', left: `${a.x*100}%`, top: `${a.y*100}%`,
            transform: 'translate(-50%,-50%)',
            width: 18, height: 18, borderRadius: '50%',
            background: t.red, border: '2px solid #fff',
            boxShadow: '0 2px 6px rgba(40,38,34,0.30)', zIndex: 5,
          }} />
      ))}
      {annotations.filter((a) => a.type === 'note').map((a) => (
        <div key={a.id} style={{
          position: 'absolute', left: `${a.x*100}%`, top: `${a.y*100}%`,
          transform: 'translate(8px, -50%)', maxWidth: 200,
          background: '#fff', border: `1px solid ${t.ink10}`,
          padding: '6px 10px', borderRadius: 8, fontSize: 11,
          color: t.ink, boxShadow: t.shadowSm, zIndex: 5,
        }}>
          {a.text}
        </div>
      ))}
    </>
  );
}

function labelChip(t) {
  return {
    position: 'absolute', top: 12, left: 14, zIndex: 3,
    background: '#fff', color: t.ink, fontSize: 10, fontWeight: 600,
    fontFamily: t.fontMono, letterSpacing: '0.16em',
    padding: '4px 8px', borderRadius: 4, boxShadow: t.shadowSm,
  };
}

function HowItWorksModal({ onClose }) {
  const t = window.theme;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(28,26,24,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: 24,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: t.bg, borderRadius: t.radiusLg, maxWidth: 720,
        width: '100%', maxHeight: '85vh', overflow: 'auto',
        boxShadow: '0 30px 80px rgba(28,26,24,0.35)',
        padding: '28px 32px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={window._kicker(t)}>Replay · how it works</div>
            <h2 style={{ fontFamily: t.fontDisplay, fontStyle: 'italic',
              fontSize: 32, fontWeight: 400, margin: '4px 0 0', color: t.ink }}>
              Three phases, one feedback loop.
            </h2>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 22,
              color: t.ink55, cursor: 'pointer', padding: 4 }}>×</button>
        </div>

        <Section t={t} num="01" title="Upload" tag="Phase 1">
          You drop a 15-second rugby clip. The video is uploaded to a FastAPI
          backend (<Mono>POST /upload</Mono>), stored, and a <Mono>video_id</Mono> comes back.
          You optionally type a <em>focus prompt</em> ("watch the inside centre's line")
          to bias the analyser.
        </Section>

        <Section t={t} num="02" title="Analyse" tag="Phase 2">
          On <Mono>POST /analyse</Mono>, a Prefect flow runs Roboflow tracking at 5fps,
          assigns jersey numbers, projects positions onto a normalised pitch (0&ndash;1 coords),
          and a Haiku pass writes a natural-language description of what happened. The UI
          polls <Mono>GET /status/:job_id</Mono> and renders that pipeline as the rugby-ball
          loader's step list.
          <br /><br />
          You then mark up what was wrong: pick a player, set a <strong>From</strong> point
          (where the model thinks they were) and a <strong>To</strong> point (where they
          should have been), add a free-text note. Each correction becomes a
          <Mono> {`{playerId, frameTime, fromX/Y, toX/Y, note}`}</Mono> object.
        </Section>

        <Section t={t} num="03" title="Generate &amp; refine" tag="Phase 3 — you are here">
          On <Mono>POST /generate</Mono>, your corrections + the analyser's description
          are sent to an LLM that rewrites them into a precise Seedance video-gen prompt
          (visible in the right rail). Seedance regenerates the clip with corrected positions.
          <br /><br />
          The two clips play in lockstep below — original on the left, regenerated on the
          right. You can <strong>annotate either clip</strong> with the Draw, Pin, and Note tools;
          each annotation records which side it belongs to (<Mono>side: 'orig' | 'new'</Mono>),
          its timestamp, and normalised x/y. Annotations on the original say "the model still
          got this wrong" and feed the next refinement loop; annotations on the regenerated
          clip say "this part of the new output isn't right yet."
          <br /><br />
          Hit <strong>Regenerate</strong> with both annotation sets and the loop repeats —
          each pass converges on a faithful replay of what actually happened.
        </Section>

        <div style={{
          marginTop: 24, padding: '14px 16px', background: t.bgInset,
          borderRadius: t.radiusSm, fontSize: 12, color: t.ink70, lineHeight: 1.6,
        }}>
          <strong style={{ color: t.ink }}>Tip:</strong> the scrubber marker badges show
          which side each annotation lives on (<Mono>orig:pin</Mono>, <Mono>new:draw</Mono>).
          Annotations within ±1.5s of the playhead are visible on the clip; the right-rail
          list always shows everything.
        </div>
      </div>
    </div>
  );
}

function Section({ t, num, title, tag, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr',
      gap: 16, padding: '16px 0', borderTop: `1px solid ${t.ink06}` }}>
      <div style={{
        fontFamily: t.fontMono, fontSize: 11, color: t.red,
        letterSpacing: '0.1em',
      }}>{num}</div>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: t.ink }}>{title}</h3>
          <span style={{
            fontSize: 9, fontFamily: t.fontMono, letterSpacing: '0.08em',
            padding: '2px 6px', borderRadius: 3, background: t.ink06, color: t.ink55,
          }}>{tag}</span>
        </div>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: t.ink70 }}>{children}</p>
      </div>
    </div>
  );
}

function Mono({ children }) {
  const t = window.theme;
  return <code style={{
    fontFamily: t.fontMono, fontSize: 11, background: t.ink06,
    padding: '1px 5px', borderRadius: 3, color: t.ink,
  }}>{children}</code>;
}

window.GenerateScreen = GenerateScreen;
