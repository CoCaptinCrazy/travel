import json
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


class GeminiProviderError(Exception):
    pass


def generate(prompt, api_key):
    model = "gemini-2.5-flash"
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model}:generateContent?key={quote(api_key)}"
    )
    request = Request(
        url,
        data=json.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=25) as response:
            result = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        raise GeminiProviderError(f"Gemini returned HTTP {error.code}.") from error
    except (URLError, TimeoutError, json.JSONDecodeError, UnicodeDecodeError) as error:
        raise GeminiProviderError(
            "Gemini could not be reached or returned invalid data."
        ) from error
    try:
        parts = result["candidates"][0]["content"]["parts"]
        reply = "".join(
            part["text"]
            for part in parts
            if isinstance(part, dict) and isinstance(part.get("text"), str)
        )
    except (KeyError, IndexError, TypeError) as error:
        raise GeminiProviderError("Gemini returned an unexpected response.") from error
    if not reply.strip():
        raise GeminiProviderError("Gemini returned an empty response.")
    return reply
