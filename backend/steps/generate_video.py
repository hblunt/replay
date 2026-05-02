from prefect import task

from schemas import GeneratedVideo, RefinedPrompt


@task(retries=3)
def generate_video(video_id: str, prompt: RefinedPrompt) -> GeneratedVideo:
    raise NotImplementedError
