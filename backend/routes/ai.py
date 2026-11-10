from backend.models.response import failure, success


PROMPTS = [
    {"id": "summarize", "label": "Summarize", "prompt": "Summarize this text:"},
    {"id": "explain", "label": "Explain simply", "prompt": "Explain this simply:"},
    {"id": "ideas", "label": "Brainstorm", "prompt": "Help me brainstorm:"},
]


def handle(context):
    if context.path == "/api/ai/prompts" and context.method == "GET":
        return success({"prompts": PROMPTS, "available": False})
    if context.path == "/api/ai/models" and context.method == "GET":
        return success({"models": [], "available": False})
    if context.path == "/api/ai/chat" and context.method == "POST":
        return failure("AI is not configured. Add a provider integration before using this feature.", 503)
    return None
