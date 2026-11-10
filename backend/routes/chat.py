import sqlite3
import re

from backend.database import connect
from backend.models.response import failure, success
from backend.models.user import utc_now
from backend.routes import require_user


def handle(context):
    if context.path == "/api/chat/rooms" and context.method == "GET":
        with connect() as db:
            rooms = db.execute(
                "SELECT r.id, r.name, COUNT(m.id) AS messages "
                "FROM chat_rooms r LEFT JOIN chat_messages m ON m.room_id = r.id "
                "GROUP BY r.id ORDER BY r.name"
            ).fetchall()
        return success({"rooms": [dict(row) for row in rooms]})

    if context.path == "/api/chat/rooms" and context.method == "POST":
        denied = require_user(context)
        if denied:
            return denied
        name = context.data.get("name")
        if not isinstance(name, str) or not re.fullmatch(r"[A-Za-z0-9 _-]{2,32}", name.strip()):
            return failure("Room names must be 2–32 letters, numbers, spaces, underscores, or hyphens.")
        try:
            with connect() as db:
                cursor = db.execute(
                    "INSERT INTO chat_rooms (name, created_at) VALUES (?, ?)",
                    (name.strip(), utc_now()),
                )
                room_id = cursor.lastrowid
        except sqlite3.IntegrityError:
            return failure("That room already exists.", 409)
        return success({"id": room_id, "name": name.strip()}, 201)

    match = re.fullmatch(r"/api/chat/rooms/(\d+)/messages", context.path)
    if match and context.method in {"GET", "POST"}:
        denied = require_user(context)
        if denied:
            return denied
        room_id = int(match.group(1))
        with connect() as db:
            room = db.execute("SELECT id FROM chat_rooms WHERE id = ?", (room_id,)).fetchone()
            if not room:
                return failure("Room not found.", 404)
            if context.method == "POST":
                message = context.data.get("message")
                if not isinstance(message, str) or not message.strip() or len(message.strip()) > 1000:
                    return failure("Messages must be between 1 and 1000 characters.")
                cursor = db.execute(
                    "INSERT INTO chat_messages (room_id, user_id, message, created_at) "
                    "VALUES (?, ?, ?, ?)",
                    (room_id, context.user["id"], message.strip(), utc_now()),
                )
                row = db.execute(
                    "SELECT m.id, m.message, m.created_at, u.username FROM chat_messages m "
                    "JOIN users u ON u.id = m.user_id WHERE m.id = ?",
                    (cursor.lastrowid,),
                ).fetchone()
                return success({"message": dict(row)}, 201)
            rows = db.execute(
                "SELECT m.id, m.message, m.created_at, u.username FROM chat_messages m "
                "JOIN users u ON u.id = m.user_id WHERE m.room_id = ? "
                "ORDER BY m.id DESC LIMIT 50",
                (room_id,),
            ).fetchall()
        return success({"messages": [dict(row) for row in reversed(rows)]})

    if context.path == "/api/friends" and context.method == "GET":
        denied = require_user(context)
        if denied:
            return denied
        with connect() as db:
            rows = db.execute(
                "SELECT fr.id, fr.status, fr.created_at, "
                "CASE WHEN fr.sender_id = ? THEN recipient.username ELSE sender.username END AS username, "
                "CASE WHEN fr.sender_id = ? THEN 'outgoing' ELSE 'incoming' END AS direction "
                "FROM friend_requests fr JOIN users sender ON sender.id = fr.sender_id "
                "JOIN users recipient ON recipient.id = fr.recipient_id "
                "WHERE fr.sender_id = ? OR fr.recipient_id = ? ORDER BY fr.id DESC",
                (context.user["id"], context.user["id"], context.user["id"], context.user["id"]),
            ).fetchall()
        return success({"friends": [dict(row) for row in rows]})

    if context.path == "/api/friends" and context.method == "POST":
        denied = require_user(context)
        if denied:
            return denied
        username = context.data.get("username")
        if not isinstance(username, str):
            return failure("Enter a username.")
        with connect() as db:
            target = db.execute(
                "SELECT id FROM users WHERE username = ? COLLATE NOCASE", (username.strip(),)
            ).fetchone()
            if target is None:
                return failure("User not found.", 404)
            if target["id"] == context.user["id"]:
                return failure("You cannot add yourself.")
            existing = db.execute(
                "SELECT id FROM friend_requests WHERE "
                "(sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)",
                (context.user["id"], target["id"], target["id"], context.user["id"]),
            ).fetchone()
            if existing:
                return failure("A request or friendship already exists.", 409)
            db.execute(
                "INSERT INTO friend_requests (sender_id, recipient_id, created_at) VALUES (?, ?, ?)",
                (context.user["id"], target["id"], utc_now()),
            )
            db.execute(
                "INSERT INTO notifications (user_id, message, created_at) VALUES (?, ?, ?)",
                (target["id"], f"{context.user['username']} sent you a friend request.", utc_now()),
            )
        return success({"sent": True}, 201)

    match = re.fullmatch(r"/api/friends/(\d+)/accept", context.path)
    if match and context.method == "PATCH":
        denied = require_user(context)
        if denied:
            return denied
        with connect() as db:
            cursor = db.execute(
                "UPDATE friend_requests SET status = 'accepted' "
                "WHERE id = ? AND recipient_id = ? AND status = 'pending'",
                (int(match.group(1)), context.user["id"]),
            )
        return success({"accepted": cursor.rowcount == 1})
    return None
