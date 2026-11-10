import re

from backend.database import connect
from backend.models.response import failure, success
from backend.routes import require_user


GAME_ID = re.compile(r"^[a-z0-9-]{1,48}$")


def handle(context):
    if context.path == "/api/games" and context.method == "GET":
        with connect() as db:
            rows = db.execute(
                "SELECT g.id, g.title, g.description, g.category, "
                "ROUND(AVG(r.rating), 1) AS rating, COUNT(r.rating) AS ratings "
                "FROM games g LEFT JOIN game_ratings r ON r.game_id = g.id "
                "GROUP BY g.id ORDER BY g.title"
            ).fetchall()
        return success({"games": [dict(row) for row in rows]})

    match = re.fullmatch(r"/api/games/([a-z0-9-]+)/rating", context.path)
    if match and context.method == "POST":
        denied = require_user(context)
        if denied:
            return denied
        rating = context.data.get("rating")
        if not isinstance(rating, int) or isinstance(rating, bool) or not 1 <= rating <= 5:
            return failure("Rating must be a whole number from 1 to 5.")
        with connect() as db:
            exists = db.execute("SELECT 1 FROM games WHERE id = ?", (match.group(1),)).fetchone()
            if not exists:
                return failure("Game not found.", 404)
            db.execute(
                "INSERT INTO game_ratings (user_id, game_id, rating) VALUES (?, ?, ?) "
                "ON CONFLICT(user_id, game_id) DO UPDATE SET rating = excluded.rating",
                (context.user["id"], match.group(1), rating),
            )
        return success({"rating": rating})
    return None
