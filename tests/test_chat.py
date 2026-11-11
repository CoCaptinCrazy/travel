import sqlite3
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

import backend.database as database
from backend.models.user import create_user
from backend.routes import RequestContext
from backend.routes import chat


class ChatRouteTests(unittest.TestCase):
    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        self.addCleanup(self.tempdir.cleanup)
        database_path = Path(self.tempdir.name) / "travelx.sqlite"
        self.database_patcher = patch.object(database, "DATABASE_PATH", database_path)
        self.database_patcher.start()
        self.addCleanup(self.database_patcher.stop)
        database.initialize()

        self.admin = create_user("ChatAdmin", "a-secure-example-password")
        self.moderator = create_user("ChatMod", "a-secure-example-password")
        self.member = create_user("ChatMember", "a-secure-example-password")
        with database.connect() as db:
            db.execute("UPDATE users SET role = 'admin' WHERE id = ?", (self.admin["id"],))
            db.execute(
                "INSERT INTO chat_memberships (user_id, role, assigned_by, assigned_at) "
                "VALUES (?, 'moderator', ?, '2026-01-01T00:00:00+00:00')",
                (self.moderator["id"], self.admin["id"]),
            )
        self.admin["role"] = "admin"

    def request(self, path, method="GET", user=None, data=None):
        context = RequestContext(
            handler=SimpleNamespace(headers={}),
            method=method,
            path=path,
            data=data or {},
            session={"user": user} if user else None,
        )
        return chat.handle(context)

    def room_id(self, name):
        with database.connect() as db:
            return db.execute(
                "SELECT id FROM chat_rooms WHERE name = ?", (name,)
            ).fetchone()["id"]

    def test_channels_are_grouped_and_role_restricted_channels_are_hidden(self):
        channels = self.request("/api/chat/rooms", user=self.member)
        names = {room["name"] for room in channels.body["data"]["rooms"]}
        self.assertIn("lobby", names)
        self.assertIn("announcements", names)
        self.assertNotIn("staff", names)
        self.assertEqual(channels.body["data"]["role"], "member")

        staff = self.request(
            f"/api/chat/rooms/{self.room_id('staff')}/messages", user=self.member
        )
        self.assertEqual(staff.status, 403)

        moderator_channels = self.request("/api/chat/rooms", user=self.moderator)
        moderator_names = {
            room["name"] for room in moderator_channels.body["data"]["rooms"]
        }
        self.assertIn("staff", moderator_names)

    def test_announcement_posting_is_moderator_only(self):
        announcement_id = self.room_id("announcements")
        denied = self.request(
            f"/api/chat/rooms/{announcement_id}/messages",
            "POST",
            self.member,
            {"message": "A member announcement"},
        )
        accepted = self.request(
            f"/api/chat/rooms/{announcement_id}/messages",
            "POST",
            self.moderator,
            {"message": "A moderator announcement"},
        )
        self.assertEqual(denied.status, 403)
        self.assertEqual(accepted.status, 201)
        self.assertEqual(accepted.body["data"]["message"]["role"], "moderator")

    def test_moderators_can_create_public_channels_but_not_admin_only_channels(self):
        created = self.request(
            "/api/chat/rooms",
            "POST",
            self.moderator,
            {
                "name": "weekend-plans",
                "category": "Community",
                "description": "Share what you are up to.",
                "readRole": "member",
                "writeRole": "member",
            },
        )
        restricted = self.request(
            "/api/chat/rooms",
            "POST",
            self.moderator,
            {
                "name": "private-plans",
                "category": "Staff",
                "readRole": "admin",
                "writeRole": "admin",
            },
        )
        self.assertEqual(created.status, 201)
        self.assertEqual(created.body["data"]["name"], "weekend-plans")
        self.assertEqual(restricted.status, 403)

    def test_only_admins_can_assign_chat_moderator_role(self):
        promoted = self.request(
            f"/api/chat/members/{self.member['id']}/role",
            "PATCH",
            self.admin,
            {"role": "moderator"},
        )
        denied = self.request(
            f"/api/chat/members/{self.member['id']}/role",
            "PATCH",
            self.moderator,
            {"role": "member"},
        )
        self.assertEqual(promoted.status, 200)
        self.assertEqual(promoted.body["data"]["role"], "moderator")
        self.assertEqual(denied.status, 403)

        member_list = self.request("/api/chat/members", user=self.admin)
        member = next(
            row for row in member_list.body["data"]["members"]
            if row["id"] == self.member["id"]
        )
        self.assertEqual(member["chat_role"], "moderator")

        self.request(
            f"/api/chat/members/{self.member['id']}/role",
            "PATCH",
            self.admin,
            {"role": "member"},
        )
        with database.connect() as db:
            self.assertIsNone(
                db.execute(
                    "SELECT user_id FROM chat_memberships WHERE user_id = ?",
                    (self.member["id"],),
                ).fetchone()
            )

    def test_invalid_role_value_is_rejected(self):
        response = self.request(
            f"/api/chat/members/{self.member['id']}/role",
            "PATCH",
            self.admin,
            {"role": []},
        )
        self.assertEqual(response.status, 400)


class LegacyChatSchemaTests(unittest.TestCase):
    def test_initialize_migrates_existing_rooms(self):
        tempdir = tempfile.TemporaryDirectory()
        self.addCleanup(tempdir.cleanup)
        database_path = Path(tempdir.name) / "legacy.sqlite"
        db = sqlite3.connect(database_path)
        try:
            db.execute(
                "CREATE TABLE chat_rooms (id INTEGER PRIMARY KEY, name TEXT UNIQUE, created_at TEXT)"
            )
            db.execute(
                "INSERT INTO chat_rooms (id, name, created_at) "
                "VALUES (1, 'lobby', '2026-01-01T00:00:00+00:00')"
            )
            db.commit()
        finally:
            db.close()
        with patch.object(database, "DATABASE_PATH", database_path):
            database.initialize()
            with database.connect() as db:
                columns = {
                    row["name"] for row in db.execute("PRAGMA table_info(chat_rooms)")
                }
                lobby = db.execute(
                    "SELECT category, description, read_role, write_role "
                    "FROM chat_rooms WHERE name = 'lobby'"
                ).fetchone()
                self.assertTrue(
                    {"category", "description", "read_role", "write_role"}.issubset(columns)
                )
                self.assertEqual(lobby["category"], "Start here")
                self.assertEqual(lobby["read_role"], "member")
                self.assertEqual(
                    db.execute(
                        "SELECT COUNT(*) FROM chat_rooms WHERE name = 'staff'"
                    ).fetchone()[0],
                    1,
                )


if __name__ == "__main__":
    unittest.main()
