class AIProviderNotConfigured(RuntimeError):
    pass


def generate_reply(prompt):
    if not isinstance(prompt, str) or not prompt.strip():
        raise ValueError("A prompt is required.")
    raise AIProviderNotConfigured(
        "AI is not configured. Add a provider integration before using this feature."
    )
