# Architecture

TravelX is a same-origin web app:

- `frontend/` contains static HTML, CSS, and browser-native JavaScript modules.
- `backend/app.py` serves those files and the JSON API using `http.server`.
- `backend/routes/` implements API endpoints; `backend/database.py` initializes SQLite.
- `databases/travelx.db` is generated locally and excluded from version control.

The browser opens HTTP(S) addresses in a separate browser tab. It does not fetch or embed third-party pages. Chat uses short polling, not a WebSocket server.

## Feature status

Accounts, profiles, settings, browser bookmarks/history, a sample arcade game and rating UI, watchlist/reviews, room chat/friend requests, notifications, and an admin overview are implemented locally. The movie and game catalogs are sample metadata. AI shows an explicit unconfigured state; marketplace listings are informational and do not load executable plugins. Music links open third-party services directly. Downloads remain managed by the user's browser.

## Security boundaries

The app binds to loopback by default, uses parameterized SQL, salted scrypt password hashes, HTTP-only session cookies, CSRF tokens, same-origin checks, request-size limits, output escaping, and basic response security headers. This is a local development starter, not a hardened public deployment.
