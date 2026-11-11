# Local deployment

Run `python -m backend.app` from the repository root with Python 3.11 or newer, and leave that terminal running while you use TravelX. The service listens on `127.0.0.1:3000` unless `TRAVELX_HOST` or `TRAVELX_PORT` is set. Open the exact address printed by the server; opening the HTML directly, using a static-file server such as VS Code Live Server, or using an old browser tab after the server stops will prevent account and chat API requests from reaching the TravelX backend.

For a reverse-proxy HTTPS setup, configure `TRAVELX_COOKIE_SECURE=1` and set `TRAVELX_ORIGIN` to the exact public origin (for example `https://travelx.example`). Do not expose the development server directly to the internet. Add a production WSGI server, rate limiting, backups, monitoring, and deployment-specific hardening before public use.
