import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIR = ROOT / "frontend"
DATABASE_PATH = Path(os.environ.get("TRAVELX_DB", ROOT / "databases" / "travelx.db"))
HOST = os.environ.get("TRAVELX_HOST", "127.0.0.1")
PORT = int(os.environ.get("TRAVELX_PORT", "3000"))
COOKIE_SECURE = os.environ.get("TRAVELX_COOKIE_SECURE", "").lower() in {"1", "true", "yes"}
PUBLIC_ORIGIN = os.environ.get("TRAVELX_ORIGIN")
SESSION_MAX_AGE = 60 * 60 * 24 * 14
MAX_REQUEST_BYTES = 64 * 1024
