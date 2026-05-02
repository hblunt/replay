"""Stage 1 video analysis — extract keyframes and ask Claude vision for one
short tactical observation grounded in the user's focus prompt.

Replaces the hardcoded mock summary on the Analyse screen with a real,
clip-aware response. No Roboflow involved.
"""

from __future__ import annotations

import base64
import tempfile

import cv2
import httpx
from anthropic import Anthropic
from prefect import task

_ANALYSE_SYSTEM = """You are a rugby coach analysing match footage. The user has asked you to focus on something specific. Look at the supplied keyframes and give one concrete tactical observation that addresses their focus.

Rules:
- Be specific. Use rugby terminology (positions, set pieces, phases, line speed, depth, channel).
- Identify players by jersey colour + position when possible (e.g. "the yellow team's right winger").
- If their concern is valid, name it plainly: "the right winger is too deep, ~4m behind the gain line".
- If everything looks correct, say so plainly: "the right winger is in the correct position, holding the channel".
- 1–2 sentences, no preamble, no headings.
- If the focus is empty or generic, give the most important tactical observation you can see.
"""


def _extract_frames(video_bytes: bytes, n: int = 4) -> list[bytes]:
    """Pull `n` evenly-spaced JPEG keyframes from an in-memory mp4."""
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as f:
        f.write(video_bytes)
        path = f.name

    cap = cv2.VideoCapture(path)
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total <= 0:
        cap.release()
        return []

    indices = [int(total * i / (n + 1)) for i in range(1, n + 1)]
    frames: list[bytes] = []
    for idx in indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ok, frame = cap.read()
        if not ok:
            continue
        h, w = frame.shape[:2]
        if w > 800:
            scale = 800 / w
            frame = cv2.resize(frame, (800, int(h * scale)))
        ok, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        if ok:
            frames.append(buf.tobytes())
    cap.release()
    return frames


@task(retries=2)
def analyse_video(api_key: str, video_url: str, focus_prompt: str | None) -> str:
    r = httpx.get(video_url, timeout=60, follow_redirects=True)
    r.raise_for_status()

    frames = _extract_frames(r.content, n=4)
    if not frames:
        return "Could not extract frames from the clip."

    user_text = (
        f"Coach's focus: {focus_prompt.strip()}"
        if focus_prompt and focus_prompt.strip()
        else "No specific focus given — call out the most important tactical observation."
    )

    client = Anthropic(api_key=api_key)
    msg = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=512,
        system=_ANALYSE_SYSTEM,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": user_text},
                    *[
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/jpeg",
                                "data": base64.b64encode(f).decode(),
                            },
                        }
                        for f in frames
                    ],
                ],
            }
        ],
    )
    return msg.content[0].text.strip()
