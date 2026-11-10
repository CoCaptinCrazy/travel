from urllib.parse import quote_plus, urlsplit


def destination_for(value):
    query = value.strip()
    if not query:
        raise ValueError("Enter a search or web address.")
    if "://" in query:
        parsed = urlsplit(query)
        if parsed.scheme not in {"http", "https"} or not parsed.hostname:
            raise ValueError("Only HTTP and HTTPS addresses are supported.")
        return query
    if " " not in query and "." in query:
        return f"https://{query}"
    return f"https://www.google.com/search?q={quote_plus(query)}"
