# API overview

All API routes are same-origin and return JSON in the form `{ "ok": true, "data": ... }` or `{ "ok": false, "error": "..." }`. Mutating requests use JSON and, after sign-in, the `X-CSRF-Token` returned by `GET /api/me`.

| Area | Routes |
|---|---|
| Auth | `GET /api/me`, `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout` |
| Profile | `GET /api/profile`, `PATCH /api/settings`, `GET /api/notifications` |
| Browser | `GET/POST /api/bookmarks`, `DELETE /api/bookmarks/{id}`, `GET/POST/DELETE /api/history` |
| Games | `GET /api/games`, `POST /api/games/{id}/rating` |
| Cinema | `GET /api/movies`, `GET/POST /api/movies/{id}/reviews`, `GET /api/watchlist`, `POST/DELETE /api/watchlist/{id}` |
| Pulse | `GET/POST /api/chat/rooms`, `GET/POST /api/chat/rooms/{id}/messages`, `GET/POST /api/friends`, `PATCH /api/friends/{id}/accept` |
| Nova | `GET /api/ai/models`, `GET /api/ai/prompts`, `POST /api/ai/chat` |
| Marketplace | `GET /api/plugins` |
| Admin | `GET /api/admin/stats`, `GET /api/admin/users` |

AI requests return an explicit unavailable response until a provider is configured. No provider credentials are included.
