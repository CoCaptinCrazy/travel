import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

import backend.database as database
from backend.routes import RequestContext
from backend.routes import movies


class MovieRouteTests(unittest.TestCase):
    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        self.addCleanup(self.tempdir.cleanup)
        database_patcher = patch.object(
            database, "DATABASE_PATH", Path(self.tempdir.name) / "travelx.sqlite"
        )
        database_patcher.start()
        self.addCleanup(database_patcher.stop)
        database.initialize()

    def request(self, query_string=""):
        return movies.handle(
            RequestContext(
                handler=SimpleNamespace(headers={}),
                method="GET",
                path="/api/movies",
                data={},
                session=None,
                query_string=query_string,
            )
        )

    def test_placeholder_tmdb_key_keeps_search_on_local_catalog(self):
        with patch.object(movies, "TMDB_API_KEY", "your-tmdb-api-key"):
            response = self.request("q=Orbit")

        self.assertEqual(response.body["data"]["catalog"], "sample")
        self.assertEqual([row["id"] for row in response.body["data"]["movies"]], ["sample-orbit"])

    def test_tmdb_results_are_saved_for_watchlist_and_reviews(self):
        remote_result = [
            {
                "id": 603,
                "title": "The Matrix",
                "overview": "A computer hacker learns the truth.",
                "release_date": "1999-03-31",
                "genre_ids": [878, 28],
                "poster_path": "/matrix.jpg",
            }
        ]
        with (
            patch.object(movies, "TMDB_API_KEY", "real-tmdb-key"),
            patch.object(movies, "_fetch_tmdb", return_value=remote_result) as fetch,
        ):
            response = self.request("q=Matrix")

        fetch.assert_called_once_with("Matrix")
        result = response.body["data"]
        self.assertEqual(result["catalog"], "TMDB")
        self.assertEqual(result["movies"][0]["id"], "tmdb-603")
        self.assertEqual(result["movies"][0]["year"], 1999)
        self.assertEqual(result["movies"][0]["posterUrl"], "https://image.tmdb.org/t/p/w342/matrix.jpg")
        with database.connect() as db:
            row = db.execute("SELECT title FROM movies WHERE id = 'tmdb-603'").fetchone()
        self.assertEqual(row["title"], "The Matrix")


if __name__ == "__main__":
    unittest.main()
