# Database

SQLite is initialized automatically on startup. The database path defaults to `databases/travelx.db` and can be overridden with `TRAVELX_DB`.

Tables cover users and sessions, bookmarks and history, rooms and messages, friend requests, games and ratings, movie metadata and reviews, watchlists, settings, and notifications. Foreign keys are enabled. Runtime database files and backups should not be committed.
