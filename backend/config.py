import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def _load_env_file(path, environ):
    if not path.is_file():
        return
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        key, separator, value = line.partition("=")
        key = key.strip()
        if not separator or not key.isidentifier():
            raise ValueError(f"Invalid .env entry on line {line_number}.")
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
            value = value[1:-1]
        environ.setdefault(key, value)


_load_env_file(ROOT / ".env", os.environ)

FRONTEND_DIR = ROOT / "frontend"
DATABASE_PATH = Path(os.environ.get("TRAVELX_DB", ROOT / "databases" / "travelx.db"))
HOST = os.environ.get("TRAVELX_HOST", "127.0.0.1")
PORT = int(os.environ.get("TRAVELX_PORT", "3000"))
COOKIE_SECURE = os.environ.get("TRAVELX_COOKIE_SECURE", "").lower() in {"1", "true", "yes"}
PUBLIC_ORIGIN = os.environ.get("TRAVELX_ORIGIN")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
COPILOT_GITHUB_TOKEN = os.environ.get("COPILOT_GITHUB_TOKEN", "")
COPILOT_USE_CLI_AUTH = os.environ.get("COPILOT_USE_CLI_AUTH", "").lower() in {
    "1", "true", "yes",
}
TMDB_API_KEY = os.environ.get("TMDB_API_KEY", "")
SPOTIFY_CLIENT_ID = os.environ.get("SPOTIFY_CLIENT_ID", "")
SPOTIFY_CLIENT_SECRET = os.environ.get("SPOTIFY_CLIENT_SECRET", "")
YOUTUBE_MUSIC_API_KEY = os.environ.get("YOUTUBE_MUSIC_API_KEY", "")
SOUNDCLOUD_CLIENT_ID = os.environ.get("SOUNDCLOUD_CLIENT_ID", "")
SESSION_MAX_AGE = 60 * 60 * 24 * 14
MAX_REQUEST_BYTES = 64 * 1024


def has_configured_secret(value):
    value = value.strip().lower()
    return bool(value) and not value.startswith(
        ("your-", "replace-", "changeme", "<")
    )
