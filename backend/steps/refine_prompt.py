from prefect import task

from schemas import CorrectionState, RefinedPrompt


@task(retries=3)
def refine_prompt(correction_state: CorrectionState) -> RefinedPrompt:
    raise NotImplementedError
