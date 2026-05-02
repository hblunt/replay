from prefect import task

from schemas import TrackingData


@task(retries=3)
def detect_players(frames: list) -> TrackingData:
    raise NotImplementedError
