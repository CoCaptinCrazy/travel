BUILTIN_PLUGINS = (
    {
        "id": "night-sky",
        "name": "Night Sky",
        "type": "theme",
        "description": "A calm, dark color palette for late-night browsing.",
        "enabled": True,
    },
    {
        "id": "soft-morning",
        "name": "Soft Morning",
        "type": "theme",
        "description": "A bright, low-contrast workspace palette.",
        "enabled": True,
    },
    {
        "id": "focus-mode",
        "name": "Focus Mode",
        "type": "utility",
        "description": "A simple layout preset that hides extra shortcuts.",
        "enabled": False,
    },
)


def list_plugins():
    return [dict(plugin) for plugin in BUILTIN_PLUGINS]
