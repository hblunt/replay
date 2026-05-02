from prefect import task


@task
def extract_frames(video_id: str, fps: int = 5) -> list:
    raise NotImplementedError
