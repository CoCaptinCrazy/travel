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
SESSION_MAX_AGE = 60 * 60 * 24 * 14
MAX_REQUEST_BYTES = 64 * 1024
