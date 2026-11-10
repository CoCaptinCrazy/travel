import hashlib
import secrets
import time
from http.cookies import SimpleCookie

from backend.config import COOKIE_SECURE, SESSION_MAX_AGE
from backend.database import connect
from backend.models.user import find_by_id


def _token_hash(token):
    return hashlib.sha256(token.encode("ascii")).digest()


def current_session(handler):
    cookie = SimpleCookie()
    cookie.load(handler.headers.get("Cookie", ""))
    morsel = cookie.get("travelx_session")
    if morsel is None:
        return None

    with connect() as db:
        row = db.execute(
            "SELECT user_id, csrf_token, expires_at FROM sessions WHERE token_hash = ?",
            (_token_hash(morsel.value),),
        ).fetchone()
        if row is None:
            return None
        if row["expires_at"] <= int(time.time()):
            db.execute("DELETE FROM sessions WHERE token_hash = ?", (_token_hash(morsel.value),))
            return None

    user = find_by_id(row["user_id"])
    if user is None:
        return None
    return {"user": dict(user), "csrf_token": row["csrf_token"]}


def create_session(user_id):
    token = secrets.token_urlsafe(32)
    csrf_token = secrets.token_urlsafe(24)
    expires_at = int(time.time()) + SESSION_MAX_AGE
    with connect() as db:
        db.execute(
            "INSERT INTO sessions (token_hash, user_id, csrf_token, expires_at) VALUES (?, ?, ?, ?)",
            (_token_hash(token), user_id, csrf_token, expires_at),
        )
    return token, csrf_token


def session_cookie(token):
    secure = "; Secure" if COOKIE_SECURE else ""
    return f"travelx_session={token}; Path=/; Max-Age={SESSION_MAX_AGE}; HttpOnly; SameSite=Lax{secure}"


def clear_session_cookie():
    secure = "; Secure" if COOKIE_SECURE else ""
    return f"travelx_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax{secure}"


def revoke_session(handler):
    cookie = SimpleCookie()
    cookie.load(handler.headers.get("Cookie", ""))
    morsel = cookie.get("travelx_session")
    if morsel is not None:
        with connect() as db:
            db.execute("DELETE FROM sessions WHERE token_hash = ?", (_token_hash(morsel.value),))

