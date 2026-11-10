from backend.models.response import success
from plugins.plugin_loader import list_plugins


def handle(context):
    if context.path == "/api/plugins" and context.method == "GET":
        return success({"plugins": list_plugins()})
    return None
