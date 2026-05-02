// screens/Analyse.jsx — Phase 2: tactical summary + interactive video w/ corrections.

function AnalyseScreen() {
  const t = window.theme;
  const [state, setState] = window.useStore();
  const video = state.video;

  // ─── Lifecycle: kick off /analyse on mount, poll /status ─────────────────
  const [job, setJob] = React.useState(null);     // { job_id, state, progress, steps }
  React.useEffect(() => {
    if (!video) { window.navigate('/upload'); return; }
    if (state.analysis) return;                    // already have it (refresh-safe)
    let cancelled = false;
    (async () => {
      const { job_id } = await window.api.analyseVideo(video.video_id);
      const poll = async () => {
        const s = await window.api.getStatus(job_id);
        if (cancelled) return;
        setJob(s);
        if (s.state === 'completed') {
          setState({ analysis: s.result });
        } else {
          setTimeout(poll, 250);
        }
      };
      poll();
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line

  if (!video) return null;
  if (!state.analysis) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          background: t.bgRaised, borderRadius: t.radiusLg, padding: 32,
          boxShadow: t.shadow, minWidth: 460,
        }}>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={window._kicker(t)}>Phase 2 · Analysing</div>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: '6px 0 0', letterSpacing: '-0.01em' }}>
              Tracking the clip
            </h2>
          </div>
          <window.RugbyLoader steps={job?.steps || []} progress={job?.progress || 0} />
        </div>
      </div>
    );
  }

  return <AnalyseLoaded video={video} analysis={state.analysis} />;
}

function AnalyseLoaded({ video, analysis }) {
  const t = window.theme;
  const [state, setState] = window.useStore();
  const duration = video.duration || 9.4;
  const videoRef = React.useRef(null);
  const [time, setTime] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = React.useState(7);

  // RAF loop while playing — drives time + handle positions in sync.
  React.useEffect(() => {
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
    if (!v) { setPlaying((p) => !p); return; }
    if (v.paused) { v.play(); setPlaying(true); }
    else          { v.pause(); setPlaying(false); }
  };
  const seek = (s) => {
    setTime(s);
    if (videoRef.current) videoRef.current.currentTime = s;
  };

  const corrections = state.corrections;
  const selected = window.MOCK_PLAYERS.find((p) => p.id === selectedPlayerId);
  const selectedCorrection = corrections.find((c) => c.playerId === selectedPlayerId);

  // ─── Add / update correction (drag on field) ───────────────────────────
  const fieldRef = React.useRef(null);
  const [dragMode, setDragMode] = React.useState(null); // 'from' | 'to' | null
  const handleFieldClick = (e) => {
    if (!dragMode) return;
    const rect = fieldRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top)  / rect.height;
    upsertCorrection(selectedPlayerId, dragMode, x, y);
    setDragMode(null);
  };

  const upsertCorrection = (playerId, key, x, y) => {
    setState((s) => {
      const existing = s.corrections.find((c) => c.playerId === playerId);
      if (existing) {
        return {
          ...s,
          corrections: s.corrections.map((c) =>
            c.playerId === playerId
              ? { ...c, [key === 'from' ? 'fromX' : 'toX']: x, [key === 'from' ? 'fromY' : 'toY']: y }
              : c
          ),
        };
      }
      const here = window.trackAt(playerId, time) || { x: 0.5, y: 0.5 };
      return {
        ...s,
        corrections: [
          ...s.corrections,
          {
            id: 'corr_' + Math.random().toString(36).slice(2, 8),
            playerId, frameTime: time,
            fromX: key === 'from' ? x : here.x,
            fromY: key === 'from' ? y : here.y,
            toX:   key === 'to'   ? x : here.x,
            toY:   key === 'to'   ? y : here.y,
            note: '',
          },
        ],
      };
    });
  };

  const updateNote = (playerId, note) => {
    setState((s) => ({
      ...s,
      corrections: s.corrections.map((c) =>
        c.playerId === playerId ? { ...c, note } : c
      ),
    }));
  };

  const removeCorrection = (playerId) => {
    setState((s) => ({
      ...s,
      corrections: s.corrections.filter((c) => c.playerId !== playerId),
    }));
  };

  const onRegenerate = async () => {
    const { job_id } = await window.api.generateVideo(video.video_id, {
      corrections: state.corrections,
      globalPrompt: state.globalPrompt,
    });
    window.navigate('/generate/' + job_id);
  };

  const markers = corrections.map((c) => ({
    t: c.frameTime,
    label: `#${c.playerId} correction`,
  }));

  return (
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '300px 1fr 320px',
      gap: 16, padding: '0 16px 16px', overflow: 'hidden' }}>
      {/* LEFT — analysis summary + corrections list */}
      <aside style={{
        padding: '4px 8px', overflow: 'auto',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <div style={window._kicker(t)}>Summary</div>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>
          What's happening
        </h2>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: t.ink70, textWrap: 'pretty' }}>
          {analysis.summary}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Stat label="Players" value={analysis.tracked.players} />
          <Stat label="Frames"  value={analysis.tracked.frames} />
          <Stat label="Speed"   value="2.1 m/s" sub="line" />
          <Stat label="Issues"  value={analysis.flags.length} sub="flagged" />
        </div>

        {analysis.flags.length > 0 && (
          <>
            <div style={window._kicker(t)}>Flags</div>
            {analysis.flags.map((f, i) => (
              <div key={i} style={{
                background: t.bgRaised, borderRadius: t.radius, padding: '10px 12px',
                fontSize: 12, color: t.ink70, lineHeight: 1.45,
                boxShadow: t.shadowFlat,
                cursor: 'pointer',
              }} onClick={() => setSelectedPlayerId(f.player)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: t.red }} />
                  <span style={{ color: t.red, fontWeight: 600, fontSize: 11 }}>#{f.player}</span>
                </div>
                {f.text}
              </div>
            ))}
          </>
        )}

        <div style={window._kicker(t)}>Corrections ({corrections.length})</div>
        {corrections.length === 0 && (
          <div style={{ fontSize: 12, color: t.ink55, lineHeight: 1.5 }}>
            Click a player on the field, then set their start and end positions.
          </div>
        )}
        {corrections.map((co) => {
          const p = window.MOCK_PLAYERS.find((x) => x.id === co.playerId);
          const active = selectedPlayerId === co.playerId;
          return (
            <button
              key={co.id}
              onClick={() => setSelectedPlayerId(co.playerId)}
              style={{
                textAlign: 'left',
                border: `1px solid ${active ? t.ink10 : 'transparent'}`,
                background: active ? t.bgRaised : 'transparent',
                boxShadow: active ? t.shadow : 'none',
                borderRadius: t.radius, padding: '10px 12px',
                cursor: 'pointer', fontFamily: 'inherit', color: 'inherit',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>#{co.playerId} · {p?.role}</span>
                <span style={{ fontSize: 10, fontFamily: t.fontMono, color: t.ink45 }}>
                  {window.formatTime(co.frameTime)}
                </span>
              </div>
              <div style={{ fontSize: 12, color: t.ink70, marginTop: 4, lineHeight: 1.4 }}>
                {co.note || 'No note yet'}
              </div>
            </button>
          );
        })}
      </aside>

      {/* CENTER — pitch + scrubber + global prompt */}
      <main style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
        <div
          ref={fieldRef}
          onClick={handleFieldClick}
          style={{ flex: 1, position: 'relative', minHeight: 0,
            cursor: dragMode ? 'crosshair' : 'default' }}
        >
          <window.Pitch
            videoRef={videoRef}
            videoUrl={video.url || window.SAMPLE_VIDEO_URL}
            time={time} duration={duration}
            selectedPlayerId={selectedPlayerId}
            onSelectPlayer={(id) => { if (!dragMode) setSelectedPlayerId(id); }}
            corrections={corrections}
          />
          {dragMode && (
            <div style={{
              position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
              background: t.ink, color: t.bg, fontSize: 11, padding: '6px 12px',
              borderRadius: 999, fontFamily: t.fontMono, letterSpacing: '0.06em',
              zIndex: 4,
            }}>
              CLICK FIELD TO SET <strong>{dragMode.toUpperCase()}</strong> FOR #{selectedPlayerId}
            </div>
          )}
        </div>

        <window.Scrubber
          time={time} duration={duration} playing={playing}
          onPlayToggle={togglePlay} onSeek={seek}
          markers={markers}
        />

        <div style={{
          background: t.bgRaised, borderRadius: 12, padding: '12px 14px',
          boxShadow: t.shadowFlat,
        }}>
          <div style={{ ...window._kicker(t), marginBottom: 6 }}>For the whole clip</div>
          <textarea
            value={state.globalPrompt}
            onChange={(e) => setState({ globalPrompt: e.target.value })}
            rows={2}
            style={{
              width: '100%', resize: 'none', border: 'none', outline: 'none',
              background: 'transparent', fontFamily: t.fontUI,
              fontSize: 13, lineHeight: 1.5, color: t.ink, padding: 0,
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            onClick={() => { window.store.reset(); window.navigate('/upload'); }}
            style={window._btnGhost(t)}
          >Start over</button>
          <button
            onClick={onRegenerate}
            disabled={corrections.length === 0}
            style={{
              ...window._btnSolid(t),
              background: corrections.length === 0 ? t.ink25 : t.red,
              cursor: corrections.length === 0 ? 'not-allowed' : 'pointer',
              padding: '10px 18px', fontSize: 13,
            }}
          >Regenerate clip ↗</button>
        </div>
      </main>

      {/* RIGHT — selected player panel */}
      <aside style={{
        background: t.bgRaised, borderRadius: t.radiusLg,
        padding: 18, display: 'flex', flexDirection: 'column', gap: 14,
        boxShadow: t.shadow, overflow: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: t.ink, color: t.bg,
            fontFamily: t.fontMono, fontWeight: 600, fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>#{selectedPlayerId}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{selected?.role}</div>
            <div style={{ fontSize: 11, color: t.ink55, marginTop: 2, fontFamily: t.fontMono }}>
              {window.formatTime(time)} · {selected?.side === 'home' ? 'Saints' : 'Brumbies'}
            </div>
          </div>
        </div>

        <div>
          <div style={window._kicker(t)}>Position</div>
          <CRow k="From" v={selectedCorrection
            ? `${selectedCorrection.fromX.toFixed(2)}, ${selectedCorrection.fromY.toFixed(2)}`
            : '—'} />
          <CRow k="To"   v={selectedCorrection
            ? `${selectedCorrection.toX.toFixed(2)}, ${selectedCorrection.toY.toFixed(2)}`
            : '—'} accent />
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button onClick={() => setDragMode('from')}
              style={{ ...window._btnGhost(t), flex: 1, fontSize: 11 }}>
              {dragMode === 'from' ? 'Click field…' : 'Set From'}
            </button>
            <button onClick={() => setDragMode('to')}
              style={{ ...window._btnGhost(t), flex: 1, fontSize: 11,
                borderColor: t.red, color: t.red }}>
              {dragMode === 'to' ? 'Click field…' : 'Set To'}
            </button>
          </div>
        </div>

        <div>
          <div style={window._kicker(t)}>Note</div>
          <textarea
            value={selectedCorrection?.note || ''}
            onChange={(e) => {
              if (!selectedCorrection) {
                const here = window.trackAt(selectedPlayerId, time) || { x: 0.5, y: 0.5 };
                window.store.set((s) => ({
                  ...s,
                  corrections: [...s.corrections, {
                    id: 'corr_' + Math.random().toString(36).slice(2, 8),
                    playerId: selectedPlayerId, frameTime: time,
                    fromX: here.x, fromY: here.y, toX: here.x, toY: here.y,
                    note: e.target.value,
                  }],
                }));
              } else {
                updateNote(selectedPlayerId, e.target.value);
              }
            }}
            placeholder={`What should #${selectedPlayerId} have done?`}
            rows={5}
            style={{
              width: '100%', boxSizing: 'border-box',
              border: `1px solid ${t.ink10}`, borderRadius: t.radiusSm,
              padding: 10, resize: 'none', outline: 'none',
              fontFamily: t.fontUI, fontSize: 12, lineHeight: 1.5,
              background: t.bgInset, color: t.ink, marginTop: 6,
            }}
          />
        </div>

        {selectedCorrection && (
          <button
            onClick={() => removeCorrection(selectedPlayerId)}
            style={{
              background: 'transparent', border: 'none',
              color: t.ink55, fontSize: 11, cursor: 'pointer',
              fontFamily: t.fontUI, alignSelf: 'flex-start', padding: 0,
            }}
          >Remove correction for #{selectedPlayerId}</button>
        )}
      </aside>
    </div>
  );
}

function Stat({ label, value, sub }) {
  const t = window.theme;
  return (
    <div style={{
      background: t.bgRaised, borderRadius: t.radius, padding: '10px 12px',
      boxShadow: t.shadowFlat,
    }}>
      <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: 11, color: t.ink55 }}>
        {label}{sub && <span style={{ color: t.ink45 }}> · {sub}</span>}
      </div>
    </div>
  );
}

function CRow({ k, v, accent }) {
  const t = window.theme;
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '8px 0', borderBottom: `1px solid ${t.ink06}`, fontSize: 12,
    }}>
      <span style={{ color: t.ink55 }}>{k}</span>
      <span style={{
        fontFamily: t.fontMono,
        color: accent ? t.red : t.ink,
        fontWeight: accent ? 600 : 400,
      }}>{v}</span>
    </div>
  );
}

window.AnalyseScreen = AnalyseScreen;
