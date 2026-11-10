from dataclasses import dataclass

from backend.models.response import failure


@dataclass
class RequestContext:
    handler: object
    method: str
    path: str
    data: dict
    session: dict | None

    @property
    def user(self):
        return self.session["user"] if self.session else None


def require_user(context):
    if context.user is None:
        return failure("Sign in to use this feature.", 401)
    return None


def not_found():
    return failure("Not found.", 404)
