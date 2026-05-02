from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(_ENV_FILE), extra="ignore")

    butterbase_api_key: str = ""
    roboflow_api_key: str = ""
    roboflow_model_id: str = ""
    seedance_api_key: str = ""
    seedance_base_url: str = "https://ark.ap-southeast.bytepluses.com/api/v3"
    seedance_model: str = "dreamina-seedance-2-0-fast-260128"
    imarouter_api_key: str = ""
    anthropic_api_key: str = ""
    zai_api_key: str = ""


settings = Settings()
