from backend.database import connect
from backend.models.response import failure, success
from backend.routes import require_user


def handle(context):
    if context.path not in {"/api/admin/stats", "/api/admin/users"} or context.method != "GET":
        return None
    denied = require_user(context)
    if denied:
        return denied
    if context.user["role"] != "admin":
        return failure("Administrator access is required.", 403)
    with connect() as db:
        if context.path.endswith("/stats"):
            result = {
                "users": db.execute("SELECT COUNT(*) FROM users").fetchone()[0],
                "messages": db.execute("SELECT COUNT(*) FROM chat_messages").fetchone()[0],
                "bookmarks": db.execute("SELECT COUNT(*) FROM bookmarks").fetchone()[0],
                "rooms": db.execute("SELECT COUNT(*) FROM chat_rooms").fetchone()[0],
            }
            return success(result)
        rows = db.execute(
            "SELECT id, username, role, created_at FROM users ORDER BY id DESC LIMIT 100"
        ).fetchall()
    return success({"users": [dict(row) for row in rows]})
