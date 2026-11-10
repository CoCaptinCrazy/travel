from dataclasses import dataclass, field


@dataclass
class APIResponse:
    status: int
    body: dict
    headers: dict = field(default_factory=dict)


def success(data=None, status=200, **extra):
    body = {"ok": True}
    if data is not None:
        body["data"] = data
    body.update(extra)
    return APIResponse(status, body)


def failure(message, status=400):
    return APIResponse(status, {"ok": False, "error": message})
