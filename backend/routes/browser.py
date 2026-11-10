import sqlite3
from urllib.parse import urlsplit

from backend.database import connect
from backend.models.response import failure, success
from backend.models.user import utc_now
from backend.routes import require_user


def valid_web_url(value):
    if not isinstance(value, str) or len(value) > 2048:
        return False
    try:
        parsed = urlsplit(value)
        return parsed.scheme in {"http", "https"} and bool(parsed.hostname)
    except ValueError:
        return False


def handle(context):
    supported = (
        context.path in {"/api/bookmarks", "/api/history"}
        or context.path.startswith("/api/bookmarks/")
    )
    if not supported:
        return None
    denied = require_user(context)
    if denied:
        return denied
    user_id = context.user["id"]

    if context.path == "/api/bookmarks" and context.method == "GET":
        with connect() as db:
            rows = db.execute(
                "SELECT id, title, url, created_at FROM bookmarks WHERE user_id = ? ORDER BY id DESC",
                (user_id,),
            ).fetchall()
        return success({"bookmarks": [dict(row) for row in rows]})

    if context.path == "/api/bookmarks" and context.method == "POST":
        title, url = context.data.get("title"), context.data.get("url")
        if not isinstance(title, str) or not title.strip() or len(title) > 200:
            return failure("Bookmark title must be between 1 and 200 characters.")
        if not valid_web_url(url):
            return failure("Only valid HTTP and HTTPS addresses can be bookmarked.")
        try:
            with connect() as db:
                cursor = db.execute(
                    "INSERT INTO bookmarks (user_id, title, url, created_at) VALUES (?, ?, ?, ?)",
                    (user_id, title.strip(), url, utc_now()),
                )
                bookmark_id = cursor.lastrowid
        except sqlite3.IntegrityError:
            return failure("That address is already bookmarked.", 409)
        return success({"id": bookmark_id}, 201)

    if context.path.startswith("/api/bookmarks/") and context.method == "DELETE":
        try:
            bookmark_id = int(context.path.rsplit("/", 1)[1])
        except ValueError:
            return failure("Invalid bookmark id.")
        with connect() as db:
            cursor = db.execute(
                "DELETE FROM bookmarks WHERE id = ? AND user_id = ?",
                (bookmark_id, user_id),
            )
        return success({"deleted": cursor.rowcount == 1})

    if context.path == "/api/history" and context.method == "GET":
        with connect() as db:
            rows = db.execute(
                "SELECT id, title, url, visited_at FROM history WHERE user_id = ? "
                "ORDER BY id DESC LIMIT 100",
                (user_id,),
            ).fetchall()
        return success({"history": [dict(row) for row in rows]})

    if context.path == "/api/history" and context.method == "POST":
        title, url = context.data.get("title"), context.data.get("url")
        if not isinstance(title, str) or not title.strip() or len(title) > 200:
            return failure("History title must be between 1 and 200 characters.")
        if not valid_web_url(url):
            return failure("Only valid HTTP and HTTPS addresses can be saved.")
        with connect() as db:
            db.execute(
                "INSERT INTO history (user_id, title, url, visited_at) VALUES (?, ?, ?, ?)",
                (user_id, title.strip(), url, utc_now()),
            )
            db.execute(
                "DELETE FROM history WHERE user_id = ? AND id NOT IN "
                "(SELECT id FROM history WHERE user_id = ? ORDER BY id DESC LIMIT 100)",
                (user_id, user_id),
            )
        return success(status=201)

    if context.path == "/api/history" and context.method == "DELETE":
        with connect() as db:
            db.execute("DELETE FROM history WHERE user_id = ?", (user_id,))
        return success({"cleared": True})
    return None
