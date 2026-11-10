import sqlite3
from contextlib import contextmanager

from backend.config import DATABASE_PATH


@contextmanager
def connect():
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH, timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def initialize():
    with connect() as db:
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                username TEXT NOT NULL COLLATE NOCASE UNIQUE,
                password_salt BLOB NOT NULL,
                password_hash BLOB NOT NULL,
                role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS sessions (
                token_hash BLOB PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                csrf_token TEXT NOT NULL,
                expires_at INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
            CREATE TABLE IF NOT EXISTS bookmarks (
                id INTEGER PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                url TEXT NOT NULL,
                created_at TEXT NOT NULL,
                UNIQUE(user_id, url)
            );
            CREATE TABLE IF NOT EXISTS history (
                id INTEGER PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                url TEXT NOT NULL,
                visited_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS history_user_idx ON history(user_id, id DESC);
            CREATE TABLE IF NOT EXISTS chat_rooms (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS chat_messages (
                id INTEGER PRIMARY KEY,
                room_id INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                message TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS chat_messages_room_idx ON chat_messages(room_id, id DESC);
            CREATE TABLE IF NOT EXISTS friend_requests (
                id INTEGER PRIMARY KEY,
                sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
                created_at TEXT NOT NULL,
                UNIQUE(sender_id, recipient_id),
                CHECK(sender_id != recipient_id)
            );
            CREATE TABLE IF NOT EXISTS games (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                category TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS game_ratings (
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
                rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
                PRIMARY KEY(user_id, game_id)
            );
            CREATE TABLE IF NOT EXISTS movies (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                year INTEGER NOT NULL,
                genre TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS watchlist (
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                movie_id TEXT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
                created_at TEXT NOT NULL,
                PRIMARY KEY(user_id, movie_id)
            );
            CREATE TABLE IF NOT EXISTS movie_reviews (
                id INTEGER PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                movie_id TEXT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
                rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
                review TEXT NOT NULL,
                created_at TEXT NOT NULL,
                UNIQUE(user_id, movie_id)
            );
            CREATE TABLE IF NOT EXISTS settings (
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                key TEXT NOT NULL,
                value TEXT NOT NULL,
                PRIMARY KEY(user_id, key)
            );
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                message TEXT NOT NULL,
                created_at TEXT NOT NULL,
                read INTEGER NOT NULL DEFAULT 0
            );
            INSERT OR IGNORE INTO chat_rooms (id, name, created_at)
                VALUES (1, 'lobby', '2026-01-01T00:00:00+00:00');
            """
        )
        db.executemany(
            "INSERT OR IGNORE INTO games (id, title, description, category) VALUES (?, ?, ?, ?)",
            [
                ("number-guess", "Number Guess", "Find the hidden number in as few tries as possible.", "Puzzle"),
                ("coming-soon", "More games soon", "Add your own licensed games to the local catalog.", "Arcade"),
            ],
        )
        db.executemany(
            "INSERT OR IGNORE INTO movies (id, title, description, year, genre) VALUES (?, ?, ?, ?, ?)",
            [
                ("sample-orbit", "Orbit", "A sample science-fiction title for the local watchlist.", 2024, "Sci-Fi"),
                ("sample-garden", "The Garden", "A sample nature documentary entry.", 2023, "Documentary"),
                ("sample-journey", "The Long Journey", "A sample adventure title.", 2022, "Adventure"),
            ],
        )
