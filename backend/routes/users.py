import json

from backend.database import connect
from backend.models.response import failure, success
from backend.models.user import utc_now
from backend.routes import require_user


ALLOWED_SETTINGS = {"theme", "compactMode"}


def handle(context):
    if context.path == "/api/profile" and context.method == "GET":
        denied = require_user(context)
        if denied:
            return denied
        with connect() as db:
            user = db.execute(
                "SELECT id, username, role, created_at FROM users WHERE id = ?",
                (context.user["id"],),
            ).fetchone()
            settings = {
                row["key"]: json.loads(row["value"])
                for row in db.execute(
                    "SELECT key, value FROM settings WHERE user_id = ?",
                    (context.user["id"],),
                )
            }
        return success({"user": dict(user), "settings": settings})

    if context.path == "/api/settings" and context.method == "PATCH":
        denied = require_user(context)
        if denied:
            return denied
        updates = context.data.get("settings")
        if not isinstance(updates, dict) or not updates or set(updates) - ALLOWED_SETTINGS:
            return failure("Provide supported settings to update.")
        if "theme" in updates and updates["theme"] not in {"dark", "light"}:
            return failure("Theme must be dark or light.")
        if "compactMode" in updates and not isinstance(updates["compactMode"], bool):
            return failure("compactMode must be true or false.")
        with connect() as db:
            for key, value in updates.items():
                db.execute(
                    "INSERT INTO settings (user_id, key, value) VALUES (?, ?, ?) "
                    "ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value",
                    (context.user["id"], key, json.dumps(value)),
                )
        return success({"settings": updates})

    if context.path == "/api/notifications" and context.method == "GET":
        denied = require_user(context)
        if denied:
            return denied
        with connect() as db:
            rows = db.execute(
                "SELECT id, message, created_at, read FROM notifications "
                "WHERE user_id = ? ORDER BY id DESC LIMIT 50",
                (context.user["id"],),
            ).fetchall()
            db.execute(
                "UPDATE notifications SET read = 1 WHERE user_id = ?",
                (context.user["id"],),
            )
        return success({"notifications": [dict(row) for row in rows]})
    return None
