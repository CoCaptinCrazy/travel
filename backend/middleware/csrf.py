import hmac
from urllib.parse import urlsplit

from backend.config import PUBLIC_ORIGIN


def valid_origin(handler):
    origin = handler.headers.get("Origin")
    if not origin:
        return False
    expected = PUBLIC_ORIGIN or f"http://{handler.headers.get('Host', '')}"
    try:
        supplied = urlsplit(origin)
        allowed = urlsplit(expected)
    except ValueError:
        return False
    return (
        supplied.scheme in {"http", "https"}
        and supplied.scheme == allowed.scheme
        and supplied.netloc.lower() == allowed.netloc.lower()
        and supplied.path in {"", "/"}
        and not supplied.query
        and not supplied.fragment
    )


def valid_csrf(handler, session):
    return bool(
        session
        and handler.headers.get("X-CSRF-Token")
        and hmac.compare_digest(handler.headers["X-CSRF-Token"], session["csrf_token"])
    )
