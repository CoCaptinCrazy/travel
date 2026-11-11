import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

import backend.database as database
from backend.routes import RequestContext
from backend.routes import auth


class RegistrationTests(unittest.TestCase):
    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        self.addCleanup(self.tempdir.cleanup)
        database_path = Path(self.tempdir.name) / "travelx.sqlite"
        self.database_patcher = patch.object(database, "DATABASE_PATH", database_path)
        self.database_patcher.start()
        self.addCleanup(self.database_patcher.stop)
        database.initialize()

    def request(self, path, data):
        context = RequestContext(
            handler=SimpleNamespace(headers={}),
            method="POST",
            path=path,
            data=data,
            session=None,
        )
        return auth.handle(context)

    def test_registration_persists_account_password_hash_and_session(self):
        response = self.request(
            "/api/auth/register",
            {"username": "Traveler_1", "password": "a-secure-example-password"},
        )

        self.assertEqual(response.status, 200)
        self.assertTrue(response.headers["Set-Cookie"].startswith("travelx_session="))
        registered_user = response.body["data"]["user"]
        self.assertEqual(registered_user["username"], "Traveler_1")
        self.assertEqual(registered_user["role"], "user")

        with database.connect() as db:
            row = db.execute(
                "SELECT id, username, password_salt, password_hash FROM users WHERE id = ?",
                (registered_user["id"],),
            ).fetchone()
            self.assertIsNotNone(row)
            self.assertNotEqual(row["password_hash"], b"a-secure-example-password")
            self.assertEqual(
                db.execute(
                    "SELECT COUNT(*) FROM sessions WHERE user_id = ?",
                    (registered_user["id"],),
                ).fetchone()[0],
                1,
            )
            self.assertEqual(
                db.execute(
                    "SELECT message FROM notifications WHERE user_id = ?",
                    (registered_user["id"],),
                ).fetchone()["message"],
                "Welcome to TravelX.",
            )

        login = self.request(
            "/api/auth/login",
            {"username": "Traveler_1", "password": "a-secure-example-password"},
        )
        self.assertEqual(login.status, 200)
        self.assertEqual(login.body["data"]["user"]["id"], registered_user["id"])
        self.assertIn("Set-Cookie", login.headers)

    def test_registration_rejects_case_insensitive_duplicate_username(self):
        first = self.request(
            "/api/auth/register",
            {"username": "Traveler", "password": "a-secure-example-password"},
        )
        duplicate = self.request(
            "/api/auth/register",
            {"username": "traveler", "password": "another-secure-password"},
        )

        self.assertEqual(first.status, 200)
        self.assertEqual(duplicate.status, 409)
        self.assertEqual(duplicate.body["error"], "That username is already in use.")

    def test_registration_rejects_invalid_username_and_short_password(self):
        invalid_username = self.request(
            "/api/auth/register",
            {"username": "bad name", "password": "a-secure-example-password"},
        )
        short_password = self.request(
            "/api/auth/register",
            {"username": "Traveler", "password": "short"},
        )

        self.assertEqual(invalid_username.status, 400)
        self.assertEqual(short_password.status, 400)
        with database.connect() as db:
            self.assertEqual(db.execute("SELECT COUNT(*) FROM users").fetchone()[0], 0)


if __name__ == "__main__":
    unittest.main()
