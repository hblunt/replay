from pydantic import BaseModel


class FieldPosition(BaseModel):
    x: float
    y: float


class PlayerPosition(BaseModel):
    player_id: int
    frame: int
    timestamp: float
    bbox: tuple[float, float, float, float]
    field_position: FieldPosition | None = None


class TrackingData(BaseModel):
    video_id: str
    fps: int
    duration: float
    players: list[PlayerPosition]


class TacticalSummary(BaseModel):
    video_id: str
    summary: str


class PlayerCorrection(BaseModel):
    player_id: int
    frame: int
    timestamp: float
    start_position: FieldPosition
    end_position: FieldPosition
    note: str | None = None


class CorrectionState(BaseModel):
    video_id: str
    player_corrections: list[PlayerCorrection]
    global_prompt: str | None = None


class RefinedPrompt(BaseModel):
    video_id: str
    prompt: str


class GeneratedVideo(BaseModel):
    video_id: str
    output_url: str
