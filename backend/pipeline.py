from prefect import flow

from schemas import CorrectionState
from steps.analyse_tactics import analyse_tactics
from steps.detect_players import detect_players
from steps.extract_frames import extract_frames
from steps.generate_video import generate_video
from steps.refine_prompt import refine_prompt


@flow(name="reframe-analyse")
def analyse_flow(video_id: str, focus_prompt: str | None = None):
    frames = extract_frames(video_id)
    tracking = detect_players(frames)
    summary = analyse_tactics(tracking, focus_prompt)
    return {"tracking": tracking, "summary": summary}


@flow(name="reframe-generate")
def generate_flow(video_id: str, correction_state: CorrectionState):
    prompt = refine_prompt(correction_state)
    output = generate_video(video_id, prompt)
    return output
