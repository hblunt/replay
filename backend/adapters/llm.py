class LLMClient:
    def complete(self, prompt: str, system: str | None = None) -> str:
        raise NotImplementedError


class ClaudeClient(LLMClient):
    def __init__(self, api_key: str, model: str = "claude-opus-4-7"):
        from anthropic import Anthropic

        self.client = Anthropic(api_key=api_key)
        self.model = model

    def complete(self, prompt: str, system: str | None = None) -> str:
        msg = self.client.messages.create(
            model=self.model,
            max_tokens=2048,
            system=system or "",
            messages=[{"role": "user", "content": prompt}],
        )
        return msg.content[0].text


class ZAIClient(LLMClient):
    """Z.AI (GLM) — OpenAI-compatible chat-completions API.

    Hackathon provided unlimited credit on this provider; preferred for the
    Seedance prompt refinement step. Vision tasks still go to Claude.
    """

    def __init__(
        self,
        api_key: str,
        model: str = "glm-4.6",
        base_url: str = "https://api.z.ai/api/paas/v4",
    ):
        self.api_key = api_key
        self.model = model
        self.base_url = base_url.rstrip("/")

    def complete(self, prompt: str, system: str | None = None) -> str:
        import httpx

        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        r = httpx.post(
            f"{self.base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": self.model,
                "messages": messages,
                "max_tokens": 2048,
                "temperature": 0.7,
            },
            timeout=120,
        )
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"].strip()


class MockLLMClient(LLMClient):
    def complete(self, prompt: str, system: str | None = None) -> str:
        return "mock llm response"
