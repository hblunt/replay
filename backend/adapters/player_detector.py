from schemas import PlayerPosition


class PlayerDetector:
    def detect(self, frame) -> list[PlayerPosition]:
        raise NotImplementedError


class RoboflowDetector(PlayerDetector):
    def __init__(self, api_key: str, model_id: str):
        self.api_key = api_key
        self.model_id = model_id

    def detect(self, frame) -> list[PlayerPosition]:
        raise NotImplementedError


class MockDetector(PlayerDetector):
    def detect(self, frame) -> list[PlayerPosition]:
        return []
