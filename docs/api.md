# API overview

All API routes are same-origin and return JSON in the form `{ "ok": true, "data": ... }` or `{ "ok": false, "error": "..." }`. Mutating requests use JSON and, after sign-in, the `X-CSRF-Token` returned by `GET /api/me`.

| Area | Routes |
|---|---|
| Auth | `GET /api/me`, `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout` |
| Profile | `GET /api/profile`, `PATCH /api/settings`, `GET /api/notifications` |
| Browser | `GET/POST /api/bookmarks`, `DELETE /api/bookmarks/{id}`, `GET/POST/DELETE /api/history` |
| Games | `GET /api/games`, `POST /api/games/{id}/rating` |
| Cinema | `GET /api/movies`, `GET/POST /api/movies/{id}/reviews`, `GET /api/watchlist`, `POST/DELETE /api/watchlist/{id}` |
| Pulse | `GET/POST /api/chat/rooms`, `GET/POST /api/chat/rooms/{id}/messages`, `GET /api/chat/members`, `PATCH /api/chat/members/{id}/role` (admins), `GET/POST /api/friends`, `PATCH /api/friends/{id}/accept` |
| Nova | `GET /api/ai/models`, `GET /api/ai/prompts`, `POST /api/ai/chat` |
| Marketplace | `GET /api/plugins` |
| Admin | `GET /api/admin/stats`, `GET /api/admin/users` |

Nova uses `GEMINI_API_KEY` first and, if Gemini fails, falls back to the GitHub Copilot SDK when enabled. The SDK uses the local Copilot CLI sign-in or `COPILOT_GITHUB_TOKEN`; there is no separate Copilot API key. Copilot is configured with no tools or workspace context. Provider credentials remain server-side, and placeholder credentials are treated as unconfigured.

Cinema uses local sample metadata without a `TMDB_API_KEY`; with a valid key, `GET /api/movies?q={query}` searches TMDB and `GET /api/movies` returns popular titles. TMDB metadata is persisted locally so watchlists and reviews work for those titles. TravelX does not provide movie streams.

Music playback is embedded in the browser from public Spotify, YouTube Music, and SoundCloud URLs. Their API credentials in `.env` are optional and are not needed for official embeds; TravelX does not host or download music.

Pulse channels include category, read-role, and write-role metadata. Members can use public channels, moderators can create channels and post in announcements, and admins can assign or remove moderator roles. The staff channel is restricted to moderators and admins.
