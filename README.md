# TravelX

TravelX is a local-first web portal with accounts, a browser start page, bookmarks and history, a small offline game, watchlists, and room-based chat. It uses a Python standard-library backend and SQLite; no Node packages or third-party services are required.

## Requirements

- Python 3.11 or newer

## Run locally

From the project directory:

```powershell
python -m backend.app
```

Then open [http://127.0.0.1:3000](http://127.0.0.1:3000). The server binds to loopback by default. Set `TRAVELX_PORT` to choose another port, `TRAVELX_DB` to choose the SQLite database path, and `TRAVELX_COOKIE_SECURE=1` plus `TRAVELX_ORIGIN=https://your-host` when serving behind HTTPS.

Register an account from the page. Passwords are stored as salted scrypt hashes. The local database is created at `databases/travelx.db`; it is runtime data and should not be committed.

To grant administrator access to an existing account, run `python -m backend.admin_cli USERNAME` from the project directory.

## Notes

- The browser opens web addresses directly in the user's browser; TravelX does not proxy or embed external websites.
- Chat is local and refreshes by polling. The AI page reports a clear unavailable status until an AI provider is deliberately integrated.
- Games and movie listings are sample local metadata, not hosted game or movie content.
- This is a local development starter, not a production deployment. Use HTTPS, backups, and a production-grade server before exposing it to a network.
