import re
import json
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlencode
from urllib.request import urlopen

from backend.config import TMDB_API_KEY, has_configured_secret
from backend.database import connect
from backend.models.response import failure, success
from backend.models.user import utc_now
from backend.routes import require_user


TMDB_API_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/w342"
GENRES = {
    28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
    80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
    14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
    9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 53: "Thriller",
    10752: "War", 37: "Western",
}


def _fetch_tmdb(query):
    endpoint = "/search/movie" if query else "/movie/popular"
    parameters = {"api_key": TMDB_API_KEY, "language": "en-US", "page": 1}
    if query:
        parameters["query"] = query
    request_url = f"{TMDB_API_URL}{endpoint}?{urlencode(parameters)}"
    try:
        with urlopen(request_url, timeout=12) as response:
            result = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        raise ValueError(f"TMDB returned HTTP {error.code}. Check the TMDB_API_KEY.") from error
    except (URLError, TimeoutError, json.JSONDecodeError, UnicodeDecodeError) as error:
        raise ValueError("TMDB could not be reached or returned invalid data.") from error
    if not isinstance(result, dict) or not isinstance(result.get("results"), list):
        raise ValueError("TMDB returned an unexpected catalog response.")
    return result["results"][:20]


def _remote_movies(query, user_id):
    try:
        remote_rows = _fetch_tmdb(query)
    except ValueError as error:
        return failure(str(error), 502)

    movies = []
    with connect() as db:
        for item in remote_rows:
            if not isinstance(item, dict) or not isinstance(item.get("id"), int):
                continue
            title = item.get("title")
            if not isinstance(title, str) or not title.strip():
                continue
            release_date = item.get("release_date", "")
            year_match = re.match(r"^\d{4}", release_date) if isinstance(release_date, str) else None
            year = int(year_match.group(0)) if year_match else 0
            overview = item.get("overview")
            description = overview.strip()[:1000] if isinstance(overview, str) else ""
            genre_ids = item.get("genre_ids", [])
            genre = next(
                (GENRES.get(genre_id) for genre_id in genre_ids if genre_id in GENRES),
                "Movie",
            ) if isinstance(genre_ids, list) else "Movie"
            movie_id = f"tmdb-{item['id']}"
            db.execute(
                "INSERT INTO movies (id, title, description, year, genre) VALUES (?, ?, ?, ?, ?) "
                "ON CONFLICT(id) DO UPDATE SET title = excluded.title, "
                "description = excluded.description, year = excluded.year, genre = excluded.genre",
                (movie_id, title.strip()[:200], description, year, genre),
            )
            poster_path = item.get("poster_path")
            poster_url = (
                f"{TMDB_IMAGE_URL}/{poster_path.lstrip('/')}"
                if isinstance(poster_path, str) and poster_path.startswith("/")
                else None
            )
            movies.append(
                {
                    "id": movie_id,
                    "title": title.strip()[:200],
                    "description": description,
                    "year": year,
                    "genre": genre,
                    "posterUrl": poster_url,
                }
            )

        if not movies:
            return success({"movies": [], "catalog": "TMDB", "query": query})
        ids = [movie["id"] for movie in movies]
        placeholders = ",".join("?" for _ in ids)
        rows = db.execute(
            "SELECT m.id, m.title, m.description, m.year, m.genre, "
            "CASE WHEN w.user_id IS NULL THEN 0 ELSE 1 END AS saved, "
            "ROUND(AVG(r.rating), 1) AS rating, COUNT(r.id) AS reviews "
            "FROM movies m LEFT JOIN watchlist w ON w.movie_id = m.id AND w.user_id = ? "
            "LEFT JOIN movie_reviews r ON r.movie_id = m.id "
            f"WHERE m.id IN ({placeholders}) GROUP BY m.id",
            (user_id, *ids),
        ).fetchall()
    by_id = {row["id"]: dict(row) for row in rows}
    for movie in movies:
        movie.update(by_id[movie["id"]])
    return success({"movies": movies, "catalog": "TMDB", "query": query})


def handle(context):
    if context.path == "/api/movies" and context.method == "GET":
        user_id = context.user["id"] if context.user else -1
        query = parse_qs(context.query_string).get("q", [""])[0].strip()[:100]
        if has_configured_secret(TMDB_API_KEY):
            return _remote_movies(query, user_id)
        with connect() as db:
            rows = db.execute(
                "SELECT m.id, m.title, m.description, m.year, m.genre, "
                "CASE WHEN w.user_id IS NULL THEN 0 ELSE 1 END AS saved, "
                "ROUND(AVG(r.rating), 1) AS rating, COUNT(r.id) AS reviews "
                "FROM movies m LEFT JOIN watchlist w ON w.movie_id = m.id AND w.user_id = ? "
                "LEFT JOIN movie_reviews r ON r.movie_id = m.id "
                "WHERE (? = '' OR m.title LIKE ? OR m.genre LIKE ? OR m.description LIKE ?) "
                "GROUP BY m.id ORDER BY m.year DESC, m.title",
                (user_id, query, f"%{query}%", f"%{query}%", f"%{query}%"),
            ).fetchall()
        return success({"movies": [dict(row) for row in rows], "catalog": "sample", "query": query})

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
