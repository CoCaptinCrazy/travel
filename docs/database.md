# Database

SQLite is initialized automatically on startup. The database path defaults to `databases/travelx.db` and can be overridden with `TRAVELX_DB`.

Tables cover users and sessions, bookmarks and history, categorized chat rooms and messages, chat moderator memberships, friend requests, games and ratings, movie metadata and reviews, watchlists, settings, and notifications. Room metadata and the membership table are added to existing databases at startup. Foreign keys are enabled. Runtime database files and backups should not be committed.
