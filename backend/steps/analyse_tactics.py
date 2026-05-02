from prefect import task

from schemas import TacticalSummary, TrackingData


@task(retries=3)
def analyse_tactics(tracking: TrackingData, focus_prompt: str | None = None) -> TacticalSummary:
    raise NotImplementedError
