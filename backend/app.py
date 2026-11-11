import json
import mimetypes
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

from backend.config import (
    FRONTEND_DIR,
    HOST,
    MAX_REQUEST_BYTES,
    PORT,
    ROOT,
)
from backend.database import initialize
from backend.middleware.auth import current_session
from backend.middleware.csrf import valid_csrf, valid_origin
from backend.middleware.logging import logger
from backend.models.response import failure
from backend.routes import RequestContext, not_found
from backend.routes import admin, ai, auth, browser, chat, games, movies, plugins, users


ROUTES = (auth, users, browser, games, movies, chat, ai, plugins, admin)


class TravelXHandler(BaseHTTPRequestHandler):
    server_version = "TravelX/1.0"
    sys_version = ""

    def log_message(self, format_string, *args):
        logger.info("%s - %s", self.address_string(), format_string % args)

    def do_GET(self):
        self._handle_request()

    def do_HEAD(self):
        self._handle_request(head_only=True)

    def do_POST(self):
        self._handle_request()

    def do_PATCH(self):
        self._handle_request()

    def do_DELETE(self):
        self._handle_request()

    def _handle_request(self, head_only=False):
        parsed = urlsplit(self.path)
        if parsed.path.startswith("/api/"):
            self._handle_api(parsed.path, head_only, parsed.query)
            return
        if self.command not in {"GET", "HEAD"}:
            self._send_json(failure("Method not allowed.", 405), head_only)
            return
        self._handle_static(parsed.path, head_only)

    def _read_json(self):
        content_length = self.headers.get("Content-Length")
        if content_length is None:
            return {}
        try:
            length = int(content_length)
        except ValueError as error:
            raise ValueError("Invalid content length.") from error
        if length < 0 or length > MAX_REQUEST_BYTES:
            raise OverflowError("Request body is too large.")
        if self.headers.get_content_type() != "application/json":
            raise ValueError("Content-Type must be application/json.")
        raw = self.rfile.read(length)
        try:
            data = json.loads(raw)
        except (json.JSONDecodeError, UnicodeDecodeError) as error:
            raise ValueError("Request body must be valid JSON.") from error
        if not isinstance(data, dict):
            raise ValueError("Request body must be a JSON object.")
        return data

    def _handle_api(self, path, head_only, query_string=""):
        if self.command not in {"GET", "HEAD", "POST", "PATCH", "DELETE"}:
            self._send_json(failure("Method not allowed.", 405), head_only)
            return
        if self.command in {"POST", "PATCH", "DELETE"} and not valid_origin(self):
            self._send_json(failure("Request origin is not allowed.", 403), head_only)
            return
        try:
            data = self._read_json() if self.command in {"POST", "PATCH"} else {}
        except OverflowError as error:
            self._send_json(failure(str(error), 413), head_only)
            return
        except ValueError as error:
            self._send_json(failure(str(error), 400), head_only)
            return

        session = current_session(self)
        if (
            self.command in {"POST", "PATCH", "DELETE"}
            and path != "/api/auth/register"
            and path != "/api/auth/login"
            and not valid_csrf(self, session)
        ):
            self._send_json(failure("Your session token is missing or expired. Refresh and try again.", 403), head_only)
            return

        context = RequestContext(
            self, self.command, path, data, session, query_string=query_string
        )
        try:
            for route in ROUTES:
                result = route.handle(context)
                if result is not None:
                    self._send_json(result, head_only)
                    return
        except Exception:
            logger.exception("Unhandled API error for %s %s", self.command, path)
            self._send_json(failure("An internal error occurred.", 500), head_only)
            return
        self._send_json(not_found(), head_only)

    def _handle_static(self, request_path, head_only):
        try:
            decoded = unquote(request_path)
            if decoded in {"/", "/index.html"}:
                root = ROOT.resolve()
                relative = "index.html"
                target = (root / relative).resolve()
            elif decoded in {"/terms.css", "/terms.js"}:
                root = ROOT.resolve()
                relative = decoded.lstrip("/")
                target = (root / relative).resolve()
            else:
                relative = decoded.removeprefix("/frontend/") if decoded.startswith("/frontend/") else decoded.lstrip("/")
                root = FRONTEND_DIR.resolve()
                target = (root / relative).resolve()
            if any(part.startswith(".") for part in Path(relative).parts):
                raise ValueError("Hidden paths are not served.")
            if root not in target.parents and target != root:
                raise ValueError("Path is outside the frontend.")
            if target.is_dir():
                target = target / "index.html"
            if not target.is_file():
                self._send_bytes(404, b"Not found", "text/plain; charset=utf-8", head_only)
                return
            body = target.read_bytes()
        except (OSError, ValueError):
            self._send_bytes(404, b"Not found", "text/plain; charset=utf-8", head_only)
            return

        content_type = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        if content_type.startswith("text/") or content_type in {
            "application/javascript",
            "application/json",
        }:
            content_type += "; charset=utf-8"
        self._send_bytes(200, body, content_type, head_only)

    def _send_json(self, result, head_only=False):
        body = json.dumps(result.body, separators=(",", ":")).encode("utf-8")
        self.send_response(result.status)
        self._security_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        for name, value in result.headers.items():
            self.send_header(name, value)
        self.end_headers()
        if not head_only:
            self.wfile.write(body)

    def _send_bytes(self, status, body, content_type, head_only=False):
        self.send_response(status)
        self._security_headers()
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if not head_only:
            self.wfile.write(body)

    def _security_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header(
            "Content-Security-Policy",
            "default-src 'self'; script-src 'self'; style-src 'self'; "
            "img-src 'self' data: https://image.tmdb.org; connect-src 'self'; "
            "frame-src https://open.spotify.com https://w.soundcloud.com "
            "https://www.youtube-nocookie.com https://www.youtube.com; "
            "object-src 'none'; base-uri 'self'; "
            "frame-ancestors 'none'; form-action 'self'",
        )


def main():
    if not 1 <= PORT <= 65535:
        raise ValueError("TRAVELX_PORT must be between 1 and 65535.")
    initialize()
    server = ThreadingHTTPServer((HOST, PORT), TravelXHandler)
    logger.info("TravelX running at http://%s:%s", HOST, PORT)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Shutting down TravelX.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
