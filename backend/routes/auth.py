import re
import sqlite3

from backend.database import connect
from backend.middleware.auth import (
    clear_session_cookie,
    create_session,
    revoke_session,
    session_cookie,
)
from backend.models.response import APIResponse, failure, success
from backend.models.user import create_user, find_user, public_user, utc_now, verify_password


USERNAME_PATTERN = re.compile(r"^[A-Za-z0-9_]{3,32}$")


def handle(context):
    if context.method == "GET" and context.path == "/api/me":
        if not context.session:
            return success({"user": None, "csrfToken": None})
        return success(
            {"user": context.user, "csrfToken": context.session["csrf_token"]}
        )

    if context.method == "POST" and context.path in {
        "/api/auth/register",
        "/api/auth/login",
    }:
        username = context.data.get("username")
        password = context.data.get("password")
        if not isinstance(username, str) or not USERNAME_PATTERN.fullmatch(username):
            return failure("Username must be 3–32 letters, numbers, or underscores.")
        if not isinstance(password, str) or not 10 <= len(password) <= 128:
            return failure("Password must be between 10 and 128 characters.")

        if context.path.endswith("/register"):
            try:
                user = create_user(username, password)
            except sqlite3.IntegrityError:
                return failure("That username is already in use.", 409)
            with connect() as db:
                db.execute(
                    "INSERT INTO notifications (user_id, message, created_at) VALUES (?, ?, ?)",
                    (user["id"], "Welcome to TravelX.", utc_now()),
                )
        else:
            record = find_user(username)
            if record is None or not verify_password(
                password, record["password_salt"], record["password_hash"]
            ):
                return failure("Username or password is incorrect.", 401)
            user = public_user(record)

        token, csrf_token = create_session(user["id"])
        return APIResponse(
            200,
            {"ok": True, "data": {"user": user, "csrfToken": csrf_token}},
            {"Set-Cookie": session_cookie(token)},
        )

    if context.method == "POST" and context.path == "/api/auth/logout":
        revoke_session(context.handler)
        return APIResponse(
            200,
            {"ok": True, "data": {"user": None}},
            {"Set-Cookie": clear_session_cookie()},
        )
    return None
