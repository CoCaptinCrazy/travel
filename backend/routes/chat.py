import sqlite3
import re

from backend.database import connect
from backend.models.response import failure, success
from backend.models.user import utc_now
from backend.routes import require_user


ROLE_RANK = {"member": 0, "moderator": 1, "admin": 2}


def _role_for(db, user):
    if user["role"] == "admin":
        return "admin"
    membership = db.execute(
        "SELECT role FROM chat_memberships WHERE user_id = ?", (user["id"],)
    ).fetchone()
    return membership["role"] if membership else "member"


def _room_for_role(db, room_id, role):
    room = db.execute(
        "SELECT id, name, category, description, read_role, write_role "
        "FROM chat_rooms WHERE id = ?",
        (room_id,),
    ).fetchone()
    if room is None:
        return None, failure("Channel not found.", 404)
    if ROLE_RANK[role] < ROLE_RANK[room["read_role"]]:
        return None, failure("You do not have access to this channel.", 403)
    return room, None


def handle(context):
    if context.path == "/api/chat/rooms" and context.method == "GET":
        denied = require_user(context)
        if denied:
            return denied
        with connect() as db:
            role = _role_for(db, context.user)
            rooms = db.execute(
                "SELECT r.id, r.name, r.category, r.description, "
                "r.read_role, r.write_role, COUNT(m.id) AS messages "
                "FROM chat_rooms r LEFT JOIN chat_messages m ON m.room_id = r.id "
                "WHERE ? >= CASE r.read_role "
                "WHEN 'member' THEN 0 WHEN 'moderator' THEN 1 ELSE 2 END "
                "GROUP BY r.id ORDER BY CASE r.category "
                "WHEN 'Start here' THEN 0 WHEN 'Community' THEN 1 "
                "WHEN 'Staff' THEN 2 ELSE 3 END, r.category, r.name",
                (ROLE_RANK[role],),
            ).fetchall()
        return success(
            {
                "rooms": [
                    {**dict(row), "canPost": ROLE_RANK[role] >= ROLE_RANK[row["write_role"]]}
                    for row in rooms
                ],
                "role": role,
            }
        )

    if context.path == "/api/chat/rooms" and context.method == "POST":
        denied = require_user(context)
        if denied:
            return denied
        category = context.data.get("category", "Community")
        name = context.data.get("name")
        description = context.data.get("description", "")
        read_role = context.data.get("readRole", "member")
        write_role = context.data.get("writeRole", "member")
        if not isinstance(name, str) or not re.fullmatch(r"[A-Za-z0-9_-]{2,32}", name.strip()):
            return failure("Channel names must be 2–32 letters, numbers, underscores, or hyphens.")
        if not isinstance(category, str) or not re.fullmatch(r"[A-Za-z0-9 _-]{2,32}", category.strip()):
            return failure("Category names must be 2–32 letters, numbers, spaces, underscores, or hyphens.")
        if not isinstance(description, str) or len(description.strip()) > 120:
            return failure("Channel descriptions can be up to 120 characters.")
        if (
            not isinstance(read_role, str)
            or read_role not in ROLE_RANK
            or not isinstance(write_role, str)
            or write_role not in ROLE_RANK
        ):
            return failure("Choose a valid channel access role.")
        if ROLE_RANK[write_role] < ROLE_RANK[read_role]:
            return failure("Posting access cannot be broader than channel access.")
        with connect() as db:
            role = _role_for(db, context.user)
        if ROLE_RANK[role] < ROLE_RANK["moderator"]:
            return failure("Moderator access is required to create channels.", 403)
        if role == "moderator" and (
            read_role == "admin" or write_role == "admin"
        ):
            return failure("Only admins can create admin-only channels.", 403)
        try:
            with connect() as db:
                cursor = db.execute(
                    "INSERT INTO chat_rooms "
                    "(name, category, description, read_role, write_role, created_at) "
                    "VALUES (?, ?, ?, ?, ?, ?)",
                    (
                        name.strip().lower(),
                        category.strip(),
                        description.strip(),
                        read_role,
                        write_role,
                        utc_now(),
                    ),
                )
                room_id = cursor.lastrowid
        except sqlite3.IntegrityError:
            return failure("That channel already exists.", 409)
        return success(
            {
                "id": room_id,
                "name": name.strip().lower(),
                "category": category.strip(),
                "description": description.strip(),
                "read_role": read_role,
                "write_role": write_role,
            },
            201,
        )

    if context.path == "/api/chat/members" and context.method == "GET":
        denied = require_user(context)
        if denied:
            return denied
        with connect() as db:
            rows = db.execute(
                "SELECT u.id, u.username, u.role AS account_role, "
                "COALESCE(cm.role, 'member') AS chat_role "
                "FROM users u LEFT JOIN chat_memberships cm ON cm.user_id = u.id "
                "ORDER BY CASE WHEN u.role = 'admin' THEN 0 "
                "WHEN cm.role = 'moderator' THEN 1 ELSE 2 END, u.username COLLATE NOCASE"
            ).fetchall()
            role = _role_for(db, context.user)
        return success({"members": [dict(row) for row in rows], "role": role})

    match = re.fullmatch(r"/api/chat/members/(\d+)/role", context.path)
    if match and context.method == "PATCH":
        denied = require_user(context)
        if denied:
            return denied
        target_id = int(match.group(1))
        new_role = context.data.get("role")
        if not isinstance(new_role, str) or new_role not in {"member", "moderator"}:
            return failure("Chat roles must be member or moderator.")
        if context.user["role"] != "admin":
            return failure("Administrator access is required to change chat roles.", 403)
        with connect() as db:
            target = db.execute(
                "SELECT id, role FROM users WHERE id = ?", (target_id,)
            ).fetchone()
            if target is None:
                return failure("Member not found.", 404)
            if target["role"] == "admin":
                return failure("Account administrators already have the highest role.", 400)
            if new_role == "member":
                db.execute(
                    "DELETE FROM chat_memberships WHERE user_id = ?", (target_id,)
                )
            else:
                db.execute(
                    "INSERT INTO chat_memberships (user_id, role, assigned_by, assigned_at) "
                    "VALUES (?, 'moderator', ?, ?) "
                    "ON CONFLICT(user_id) DO UPDATE SET role = 'moderator', "
                    "assigned_by = excluded.assigned_by, assigned_at = excluded.assigned_at",
                    (target_id, context.user["id"], utc_now()),
                )
        return success({"userId": target_id, "role": new_role})

    match = re.fullmatch(r"/api/chat/rooms/(\d+)/messages", context.path)
    if match and context.method in {"GET", "POST"}:
        denied = require_user(context)
        if denied:
            return denied
        room_id = int(match.group(1))
        with connect() as db:
            role = _role_for(db, context.user)
            room, access_error = _room_for_role(db, room_id, role)
            if access_error:
                return access_error
            if context.method == "POST":
                if ROLE_RANK[role] < ROLE_RANK[room["write_role"]]:
                    return failure("You do not have permission to post in this channel.", 403)
                message = context.data.get("message")
                if not isinstance(message, str) or not message.strip() or len(message.strip()) > 1000:
                    return failure("Messages must be between 1 and 1000 characters.")
                cursor = db.execute(
                    "INSERT INTO chat_messages (room_id, user_id, message, created_at) "
                    "VALUES (?, ?, ?, ?)",
                    (room_id, context.user["id"], message.strip(), utc_now()),
                )
                row = db.execute(
                    "SELECT m.id, m.message, m.created_at, u.username, "
                    "CASE WHEN u.role = 'admin' THEN 'admin' "
                    "ELSE COALESCE(cm.role, 'member') END AS role "
                    "FROM chat_messages m JOIN users u ON u.id = m.user_id "
                    "LEFT JOIN chat_memberships cm ON cm.user_id = u.id WHERE m.id = ?",
                    (cursor.lastrowid,),
                ).fetchone()
                return success({"message": dict(row)}, 201)
            rows = db.execute(
                "SELECT m.id, m.message, m.created_at, u.username, "
                "CASE WHEN u.role = 'admin' THEN 'admin' "
                "ELSE COALESCE(cm.role, 'member') END AS role "
                "FROM chat_messages m JOIN users u ON u.id = m.user_id "
                "LEFT JOIN chat_memberships cm ON cm.user_id = u.id "
                "WHERE m.room_id = ? "
                "ORDER BY m.id DESC LIMIT 50",
                (room_id,),
            ).fetchall()
        return success(
            {
                "messages": [dict(row) for row in reversed(rows)],
                "canPost": ROLE_RANK[role] >= ROLE_RANK[room["write_role"]],
            }
        )

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
