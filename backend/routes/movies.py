import re

from backend.database import connect
from backend.models.response import failure, success
from backend.models.user import utc_now
from backend.routes import require_user


def handle(context):
    if context.path == "/api/movies" and context.method == "GET":
        user_id = context.user["id"] if context.user else -1
        with connect() as db:
            rows = db.execute(
                "SELECT m.id, m.title, m.description, m.year, m.genre, "
                "CASE WHEN w.user_id IS NULL THEN 0 ELSE 1 END AS saved, "
                "ROUND(AVG(r.rating), 1) AS rating, COUNT(r.id) AS reviews "
                "FROM movies m LEFT JOIN watchlist w ON w.movie_id = m.id AND w.user_id = ? "
                "LEFT JOIN movie_reviews r ON r.movie_id = m.id "
                "GROUP BY m.id ORDER BY m.year DESC, m.title",
                (user_id,),
            ).fetchall()
        return success({"movies": [dict(row) for row in rows]})

    review_match = re.fullmatch(r"/api/movies/([a-z0-9-]+)/reviews", context.path)
    if review_match and context.method == "GET":
        with connect() as db:
            rows = db.execute(
                "SELECT r.rating, r.review, r.created_at, u.username FROM movie_reviews r "
                "JOIN users u ON u.id = r.user_id WHERE r.movie_id = ? "
                "ORDER BY r.id DESC LIMIT 50",
                (review_match.group(1),),
            ).fetchall()
        return success({"reviews": [dict(row) for row in rows]})

    if review_match and context.method == "POST":
        denied = require_user(context)
        if denied:
            return denied
        rating, review = context.data.get("rating"), context.data.get("review")
        if not isinstance(rating, int) or isinstance(rating, bool) or not 1 <= rating <= 5:
            return failure("Rating must be a whole number from 1 to 5.")
        if not isinstance(review, str) or len(review.strip()) > 2000:
            return failure("Review must be 2000 characters or fewer.")
        with connect() as db:
            exists = db.execute(
                "SELECT 1 FROM movies WHERE id = ?", (review_match.group(1),)
            ).fetchone()
            if not exists:
                return failure("Movie not found.", 404)
            db.execute(
                "INSERT INTO movie_reviews (user_id, movie_id, rating, review, created_at) "
                "VALUES (?, ?, ?, ?, ?) ON CONFLICT(user_id, movie_id) DO UPDATE SET "
                "rating = excluded.rating, review = excluded.review, created_at = excluded.created_at",
                (
                    context.user["id"],
                    review_match.group(1),
                    rating,
                    review.strip(),
                    utc_now(),
                ),
            )
        return success({"saved": True}, 201)

    if context.path == "/api/watchlist" and context.method == "GET":
        denied = require_user(context)
        if denied:
            return denied
        with connect() as db:
            rows = db.execute(
                "SELECT m.id, m.title, m.description, m.year, m.genre, w.created_at "
                "FROM watchlist w JOIN movies m ON m.id = w.movie_id "
                "WHERE w.user_id = ? ORDER BY w.created_at DESC",
                (context.user["id"],),
            ).fetchall()
        return success({"watchlist": [dict(row) for row in rows]})

    match = re.fullmatch(r"/api/watchlist/([a-z0-9-]+)", context.path)
    if match and context.method in {"POST", "DELETE"}:
        denied = require_user(context)
        if denied:
            return denied
        movie_id = match.group(1)
        with connect() as db:
            if context.method == "POST":
                movie = db.execute("SELECT 1 FROM movies WHERE id = ?", (movie_id,)).fetchone()
                if not movie:
                    return failure("Movie not found.", 404)
                db.execute(
                    "INSERT OR IGNORE INTO watchlist (user_id, movie_id, created_at) VALUES (?, ?, ?)",
                    (context.user["id"], movie_id, utc_now()),
                )
                return success({"saved": True}, 201)
            db.execute(
                "DELETE FROM watchlist WHERE user_id = ? AND movie_id = ?",
                (context.user["id"], movie_id),
            )
        return success({"saved": False})
    return None
