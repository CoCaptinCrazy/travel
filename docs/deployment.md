# Local deployment

Run `python -m backend.app` from the repository root with Python 3.11 or newer. The service listens on `127.0.0.1:3000` unless `TRAVELX_HOST` or `TRAVELX_PORT` is set.

For a reverse-proxy HTTPS setup, configure `TRAVELX_COOKIE_SECURE=1` and set `TRAVELX_ORIGIN` to the exact public origin (for example `https://travelx.example`). Do not expose the development server directly to the internet. Add a production WSGI server, rate limiting, backups, monitoring, and deployment-specific hardening before public use.
