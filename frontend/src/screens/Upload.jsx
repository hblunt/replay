import { useRef, useState } from 'react';
import { theme, kicker, btnSolid, btnGhost } from '../lib/theme';
import { useStore, SAMPLE_VIDEO_URL } from '../lib/store';
import { navigate } from '../lib/router';
import * as api from '../lib/api';

export default function UploadScreen() {
  const t = theme;
  const [state, setState] = useStore();
  const [dragOver, setDragOver] = useState(false);
  const [picked, setPicked] = useState(null);
  const [focus, setFocus] = useState(state.focusPrompt || '');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const accept = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPicked({ file, url });
  };

  const useSampleClip = () => {
    setPicked({
      file: { name: 'lineoutexample.mp4', size: 12_400_000 },
      url: SAMPLE_VIDEO_URL,
      sample: true,
    });
  };

  const proceed = async () => {
    setBusy(true);
    const res = await api.uploadVideo(picked?.file, focus);
    setState({
      video: { ...res, url: picked.url },
      focusPrompt: focus,
      analysis: null,
      generation: null,
      annotations: [],
    });
    navigate('/analyse');
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <div style={{
        flex: 1, display: 'grid',
        gridTemplateColumns: '1fr 460px',
        gap: 24, padding: '8px 24px 24px',
        maxWidth: 1280, width: '100%', margin: '0 auto', boxSizing: 'border-box',
      }}>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); accept(e.dataTransfer.files?.[0]); }}
          onClick={() => inputRef.current?.click()}
          style={{
            background: t.bgRaised, borderRadius: t.radiusLg,
            border: `1.5px dashed ${dragOver ? t.red : t.ink10}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 18, padding: 48, cursor: 'pointer', minHeight: 420,
            transition: 'all 0.15s', boxShadow: t.shadowFlat,
          }}
        >
          {picked ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>
              <video src={picked.url} controls style={{
                width: '100%', maxWidth: 520, borderRadius: t.radiusSm, background: t.ink,
              }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.red }} />
                <span style={{ fontWeight: 600 }}>{picked.file.name}</span>
                <span style={{ color: t.ink55, fontFamily: t.fontMono, fontSize: 11 }}>
                  {picked.file.size ? (picked.file.size / 1_000_000).toFixed(1) + ' MB' : ''}
                </span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setPicked(null); }}
                style={{
                  background: 'transparent', border: 'none', color: t.ink55,
                  cursor: 'pointer', fontSize: 12, fontFamily: t.fontUI,
                }}
              >Replace</button>
            </div>
          ) : (
            <>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: t.ink04, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, color: t.ink55,
              }}>↑</div>
              <div style={{ textAlign: 'center', maxWidth: 360 }}>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Drop a match clip here</div>
                <div style={{ fontSize: 13, color: t.ink55, lineHeight: 1.5 }}>
                  15s or less. We'll load it up so you can mark up changes and regenerate.
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }} style={btnSolid(t)}>
                  Choose file
                </button>
                <button onClick={(e) => { e.stopPropagation(); useSampleClip(); }} style={btnGhost(t)}>
                  Use sample clip
                </button>
              </div>
            </>
          )}
          <input
            ref={inputRef} type="file" accept="video/*" hidden
            onChange={(e) => accept(e.target.files?.[0])}
          />
        </div>

        <aside style={{
          background: t.bgRaised, borderRadius: t.radiusLg,
          padding: 22, display: 'flex', flexDirection: 'column', gap: 16,
          boxShadow: t.shadowFlat, alignSelf: 'start',
        }}>
          <div>
            <div style={kicker(t)}>Optional focus</div>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: '6px 0 8px', letterSpacing: '-0.01em' }}>
              Anything specific to look at?
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: t.ink70, lineHeight: 1.5 }}>
              Skip this for a general pass. Otherwise, point us at a unit, channel, or moment.
            </p>
          </div>
          <textarea
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder='e.g. "pay particular attention to what the wingers are doing on the defensive line"'
            rows={5}
            style={{
              border: `1px solid ${t.ink10}`, borderRadius: t.radiusSm,
              padding: 12, fontFamily: t.fontUI, fontSize: 13, lineHeight: 1.5,
              background: t.bgInset, color: t.ink, resize: 'none', outline: 'none',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: t.ink45, fontFamily: t.fontMono, letterSpacing: '0.04em' }}>
              {picked ? 'READY' : 'WAITING FOR CLIP'}
            </span>
            <button
              disabled={!picked || busy}
              onClick={proceed}
              style={{
                ...btnSolid(t),
                opacity: !picked || busy ? 0.4 : 1,
                cursor: !picked || busy ? 'not-allowed' : 'pointer',
              }}
            >{busy ? 'Loading…' : 'Continue ↗'}</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
