import re
from urllib.parse import quote_plus, urlsplit

ADDRESS_PATTERN = re.compile(
    r"^(?:localhost|(?:[\w-]+\.)+[a-z]{2,}|(?:\d{1,3}\.){3}\d{1,3})"
    r"(?::\d{1,5})?(?:[/?#].*)?$",
    re.IGNORECASE,
)


def destination_for(value):
    query = value.strip()
    if not query:
        raise ValueError("Enter a search or web address.")
    if "://" in query:
        parsed = urlsplit(query)
        if (
            parsed.scheme not in {"http", "https"}
            or not parsed.hostname
            or parsed.username is not None
            or parsed.password is not None
        ):
            raise ValueError("Only HTTP and HTTPS addresses are supported.")
        if parsed.port is not None and not 1 <= parsed.port <= 65535:
            raise ValueError("The web address has an invalid port.")
        return query
    if ADDRESS_PATTERN.fullmatch(query):
        destination = urlsplit(f"https://{query}")
        if not destination.hostname or (destination.port is not None and not 1 <= destination.port <= 65535):
            raise ValueError("The web address is invalid.")
        return f"https://{query}"
    if re.match(r"^[a-z][a-z\d+.-]*:", query, re.IGNORECASE):
        raise ValueError("Only HTTP and HTTPS addresses are supported.")
    return f"https://www.google.com/search?q={quote_plus(query)}"
