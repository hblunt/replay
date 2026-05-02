import time

import httpx


class VideoGenerator:
    def generate(self, prompt: str, reference_video: str) -> str:
        raise NotImplementedError


class SeedanceGenerator(VideoGenerator):
    def __init__(
        self,
        api_key: str,
        base_url: str = "https://ark.ap-southeast.bytepluses.com/api/v3",
        model: str = "dreamina-seedance-2-0-fast-260128",
        poll_interval: float = 3.0,
        timeout: float = 600.0,
    ):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.poll_interval = poll_interval
        self.timeout = timeout

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def generate(self, prompt: str, reference_video: str) -> str:
        body = {
            "model": self.model,
            "content": [
                {"type": "text", "text": prompt},
                {
                    "type": "video_url",
                    "role": "reference_video",
                    "video_url": {"url": reference_video},
                },
            ],
            "resolution": "1080p",
            "ratio": "16:9",
            "duration": 5,
            "watermark": False,
        }

        with httpx.Client(timeout=60) as client:
            r = client.post(
                f"{self.base_url}/contents/generations/tasks",
                headers=self._headers(),
                json=body,
            )
            r.raise_for_status()
            task_id = r.json()["id"]

            deadline = time.monotonic() + self.timeout
            while time.monotonic() < deadline:
                time.sleep(self.poll_interval)
                s = client.get(
                    f"{self.base_url}/contents/generations/tasks/{task_id}",
                    headers=self._headers(),
                )
                s.raise_for_status()
                data = s.json()
                if data["status"] == "succeeded":
                    return data["content"]["video_url"]
                if data["status"] in ("failed", "cancelled", "canceled"):
                    raise RuntimeError(f"Seedance task {task_id} {data['status']}: {data}")

        raise TimeoutError(f"Seedance task {task_id} did not finish in {self.timeout}s")


class ImaRouterGenerator(VideoGenerator):
    def __init__(self, api_key: str):
        self.api_key = api_key

    def generate(self, prompt: str, reference_video: str) -> str:
        raise NotImplementedError


class MockGenerator(VideoGenerator):
    def generate(self, prompt: str, reference_video: str) -> str:
        return "mock://generated.mp4"
