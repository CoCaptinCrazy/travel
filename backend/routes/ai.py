import asyncio
import os

from backend.config import (
    COPILOT_GITHUB_TOKEN,
    COPILOT_USE_CLI_AUTH,
    GEMINI_API_KEY,
    has_configured_secret,
)
from backend.middleware.logging import logger
from backend.models.response import failure, success
from backend.routes import require_user
from backend.services.gemini import GeminiProviderError, generate as generate_gemini


PROMPTS = [
    {"id": "summarize", "label": "Summarize", "prompt": "Summarize this text:"},
    {"id": "explain", "label": "Explain simply", "prompt": "Explain this simply:"},
    {"id": "ideas", "label": "Brainstorm", "prompt": "Help me brainstorm:"},
]


class ProviderError(Exception):
    pass


def _copilot_enabled():
    return COPILOT_USE_CLI_AUTH or has_configured_secret(COPILOT_GITHUB_TOKEN)


def _configured_providers():
    providers = []
    if has_configured_secret(GEMINI_API_KEY):
        providers.append({"id": "gemini", "name": "Gemini", "model": "Gemini 2.5 Flash"})
    if _copilot_enabled():
        providers.append(
            {
                "id": "copilot",
                "name": "GitHub Copilot",
                "model": "Copilot CLI default",
            }
        )
    return providers


def _copilot_reply(prompt):
    try:
        from copilot import CopilotClient
        from copilot.session_events import AssistantMessageData
    except ImportError as error:
        raise ProviderError("Install the github-copilot-sdk Python dependency.") from error

    async def request_reply():
        token = (
            COPILOT_GITHUB_TOKEN
            if has_configured_secret(COPILOT_GITHUB_TOKEN)
            else None
        )
        runtime_env = os.environ.copy()
        for key in (
            "GEMINI_API_KEY",
            "TMDB_API_KEY",
            "SPOTIFY_CLIENT_ID",
            "SPOTIFY_CLIENT_SECRET",
            "YOUTUBE_MUSIC_API_KEY",
            "SOUNDCLOUD_CLIENT_ID",
        ):
            runtime_env.pop(key, None)
        if token is None:
            runtime_env.pop("COPILOT_GITHUB_TOKEN", None)
        async with CopilotClient(
            github_token=token,
            use_logged_in_user=not bool(token),
            telemetry=None,
            env=runtime_env,
        ) as client:
            async with await client.create_session(
                available_tools=[],
                enable_config_discovery=False,
                skip_custom_instructions=True,
                enable_skills=False,
                enable_mcp_apps=False,
                enable_session_telemetry=False,
                enable_session_store=False,
                enable_file_hooks=False,
                enable_host_git_operations=False,
            ) as session:
                event = await session.send_and_wait(prompt, timeout=60)
                if event is None or not isinstance(event.data, AssistantMessageData):
                    raise ProviderError("Copilot returned no assistant response.")
                if not event.data.content.strip():
                    raise ProviderError("Copilot returned an empty response.")
                return event.data.content

    try:
        return asyncio.run(request_reply())
    except ProviderError:
        raise
    except Exception as error:
        logger.exception("GitHub Copilot SDK request failed")
        raise ProviderError(
            "Copilot could not complete the request. Check Copilot CLI authentication "
            "and the server logs."
        ) from error


def handle(context):
    if context.path == "/api/ai/prompts" and context.method == "GET":
        return success({"prompts": PROMPTS, "available": bool(_configured_providers())})
    if context.path == "/api/ai/models" and context.method == "GET":
        providers = _configured_providers()
        return success({"models": providers, "available": bool(providers)})
    if context.path == "/api/ai/chat" and context.method == "POST":
        denied = require_user(context)
        if denied:
            return denied
        prompt = context.data.get("prompt")
        if not isinstance(prompt, str) or not prompt.strip() or len(prompt) > 8000:
            return failure("Prompt must be between 1 and 8000 characters.")

        providers = _configured_providers()
        if not providers:
            return failure(
                "Nova is not configured. Add a Gemini API key or enable Copilot CLI authentication in .env.",
                503,
            )

        errors = []
        if any(provider["id"] == "gemini" for provider in providers):
            try:
                reply = generate_gemini(prompt.strip(), GEMINI_API_KEY)
                return success({"reply": reply, "provider": "Gemini"})
            except GeminiProviderError as error:
                errors.append(f"Gemini: {error}")
        if _copilot_enabled():
            try:
                return success(
                    {"reply": _copilot_reply(prompt.strip()), "provider": "GitHub Copilot"}
                )
            except ProviderError as error:
                errors.append(f"Copilot: {error}")

        return failure("AI providers failed. " + "; ".join(errors), 502)
    return None
