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
    def __init__(self, api_key: str):
        self.api_key = api_key

    def complete(self, prompt: str, system: str | None = None) -> str:
        raise NotImplementedError


class MockLLMClient(LLMClient):
    def complete(self, prompt: str, system: str | None = None) -> str:
        return "mock llm response"
