import hashlib
import hmac
import secrets
from datetime import datetime, timezone

from backend.database import connect


def utc_now():
    return datetime.now(timezone.utc).isoformat()


def hash_password(password, salt=None):
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1, dklen=64)
    return salt, digest


def verify_password(password, salt, expected):
    _, actual = hash_password(password, salt)
    return hmac.compare_digest(actual, expected)


def public_user(row):
    return {"id": row["id"], "username": row["username"], "role": row["role"]}


def create_user(username, password):
    salt, password_hash = hash_password(password)
    with connect() as db:
        cursor = db.execute(
            "INSERT INTO users (username, password_salt, password_hash, created_at) VALUES (?, ?, ?, ?)",
            (username, salt, password_hash, utc_now()),
        )
        return public_user(db.execute("SELECT * FROM users WHERE id = ?", (cursor.lastrowid,)).fetchone())


def find_user(username):
    with connect() as db:
        return db.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()


def find_by_id(user_id):
    with connect() as db:
        return db.execute("SELECT id, username, role FROM users WHERE id = ?", (user_id,)).fetchone()

