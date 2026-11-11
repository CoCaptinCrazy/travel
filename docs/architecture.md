# Architecture

TravelX is a same-origin web app:

- `frontend/` contains static HTML, CSS, and browser-native JavaScript modules.
- `backend/app.py` serves those files and the JSON API using `http.server`.
- `backend/routes/` implements API endpoints; `backend/database.py` initializes SQLite.
- `databases/travelx.db` is generated locally and excluded from version control.

The browser opens HTTP(S) addresses in a separate browser tab. It does not proxy or embed arbitrary third-party websites. Music embeds are restricted to official Spotify, YouTube, and SoundCloud players. Chat uses short polling, not a WebSocket server.

## Feature status

Accounts, profiles, settings, browser bookmarks/history, built-in arcade games and ratings, watchlist/reviews, room chat/friend requests, notifications, and an admin overview are implemented locally. Cinema uses sample metadata unless TMDB is configured; it does not stream movies. Nova optionally connects to Gemini with GitHub Copilot SDK fallback. Music uses official embeddable players and direct service links. Marketplace listings are informational and do not load executable plugins. Downloads remain managed by the user's browser.

## Security boundaries

The app binds to loopback by default, uses parameterized SQL, salted scrypt password hashes, HTTP-only session cookies, CSRF tokens, same-origin checks, request-size limits, output escaping, and basic response security headers. This is a local development starter, not a hardened public deployment.
