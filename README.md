# TravelX

TravelX is a local-first web portal with accounts, a browser start page, bookmarks and history, built-in games, movie search and watchlists, music embeds, AI assistance, and room-based chat. Its backend uses Python's standard library and SQLite; optional AI and movie metadata integrations use credentials in `.env`.

## Requirements

- Python 3.11 or newer

## Run locally

From the project directory:

```powershell
python -m backend.app
```

Then open [http://127.0.0.1:3000](http://127.0.0.1:3000). The server binds to loopback by default. Set `TRAVELX_PORT` to choose another port, `TRAVELX_DB` to choose the SQLite database path, and `TRAVELX_COOKIE_SECURE=1` plus `TRAVELX_ORIGIN=https://your-host` when serving behind HTTPS.

Optional local settings can go in the repository-root `.env` file. Existing process environment variables take precedence. Keep secrets in `.env`; it is excluded from version control.

Copy `.env.example` to `.env` and replace placeholder values to enable optional services. Install dependencies with `python -m pip install -r requirements.txt` to enable the Copilot SDK fallback. Nova tries Gemini first and then GitHub Copilot through the SDK; this uses Copilot CLI authentication or a GitHub token, not a separate Copilot API key. Cinema uses TMDB for movie metadata only. Music embeds public Spotify, YouTube Music, or SoundCloud links through their official players; its listed API credentials are optional and not required for embeds.

Register an account from the page. Passwords are stored as salted scrypt hashes. The local database is created at `databases/travelx.db`; it is runtime data and should not be committed.

To grant administrator access to an existing account, run `python -m backend.admin_cli USERNAME` from the project directory.

Run the local helper tests with `python -m unittest discover -s tests`. The same command is available through `npm test` if npm is installed.

## Notes

- The Orbit browser opens web addresses directly and does not proxy or embed arbitrary external websites. Music embeds only official provider players.
- Chat is local and refreshes by polling. Nova sends prompts to configured providers; prompts and provider credentials are sent only to those providers.
- Arcade includes locally implemented games. Cinema uses sample metadata until TMDB is configured; it links to trailer search results and does not host or stream films.
- Music embeds public content using official third-party players. Playback depends on each provider and its account/region requirements.
- This is a local development starter, not a production deployment. Use HTTPS, backups, and a production-grade server before exposing it to a network.
