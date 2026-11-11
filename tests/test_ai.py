import unittest
from types import SimpleNamespace
from unittest.mock import patch

from backend.routes import RequestContext
from backend.routes import ai


class AIRouteTests(unittest.TestCase):
    def request(self, path, method="GET", data=None):
        return ai.handle(
            RequestContext(
                handler=SimpleNamespace(headers={}),
                method=method,
                path=path,
                data=data or {},
                session={"user": {"id": 1, "username": "Test", "role": "user"}},
            )
        )

    def test_placeholder_keys_do_not_enable_ai(self):
        with (
            patch.object(ai, "GEMINI_API_KEY", "your-gemini-api-key"),
            patch.object(ai, "COPILOT_GITHUB_TOKEN", "your-copilot-github-token"),
            patch.object(ai, "COPILOT_USE_CLI_AUTH", False),
        ):
            status = self.request("/api/ai/models")
            unavailable = self.request(
                "/api/ai/chat", "POST", {"prompt": "Hello"}
            )

        self.assertFalse(status.body["data"]["available"])
        self.assertEqual(unavailable.status, 503)

    def test_copilot_is_used_when_gemini_fails(self):
        with (
            patch.object(ai, "GEMINI_API_KEY", "real-gemini-key"),
            patch.object(ai, "COPILOT_GITHUB_TOKEN", "your-copilot-github-token"),
            patch.object(ai, "COPILOT_USE_CLI_AUTH", True),
            patch.object(
                ai, "generate_gemini", side_effect=ai.GeminiProviderError("unavailable")
            ) as gemini,
            patch.object(ai, "_copilot_reply", return_value="Fallback reply"),
        ):
            response = self.request(
                "/api/ai/chat", "POST", {"prompt": "  Help me  "}
            )

        gemini.assert_called_once_with("Help me", "real-gemini-key")
        self.assertEqual(response.body["data"]["reply"], "Fallback reply")
        self.assertEqual(response.body["data"]["provider"], "GitHub Copilot")

    def test_copilot_session_has_no_tools_or_workspace_instruction_discovery(self):
        class FakeAssistantMessageData:
            def __init__(self, content):
                self.content = content

        class FakeSession:
            async def __aenter__(self):
                return self

            async def __aexit__(self, *args):
                return None

            async def send_and_wait(self, prompt, timeout):
                return SimpleNamespace(
                    data=FakeAssistantMessageData(f"Reply to {prompt}")
                )

        instances = []

        class FakeClient:
            def __init__(self, **options):
                self.options = options
                self.session_options = None
                instances.append(self)

            async def __aenter__(self):
                return self

            async def __aexit__(self, *args):
                return None

            async def create_session(self, **options):
                self.session_options = options
                return FakeSession()

        client_module = SimpleNamespace(CopilotClient=FakeClient)
        event_module = SimpleNamespace(AssistantMessageData=FakeAssistantMessageData)
        with (
            patch.dict("sys.modules", {
                "copilot": client_module,
                "copilot.session_events": event_module,
            }),
            patch.object(ai, "COPILOT_GITHUB_TOKEN", "your-copilot-github-token"),
            patch.object(ai, "COPILOT_USE_CLI_AUTH", True),
        ):
            reply = ai._copilot_reply("Hello")

        self.assertEqual(reply, "Reply to Hello")
        self.assertTrue(instances[0].options["use_logged_in_user"])
        self.assertNotIn("GEMINI_API_KEY", instances[0].options["env"])
        self.assertNotIn("TMDB_API_KEY", instances[0].options["env"])
        self.assertNotIn("COPILOT_GITHUB_TOKEN", instances[0].options["env"])
        self.assertEqual(instances[0].session_options["available_tools"], [])
        self.assertFalse(instances[0].session_options["enable_config_discovery"])
        self.assertTrue(instances[0].session_options["skip_custom_instructions"])

    def test_invalid_prompt_is_rejected(self):
        response = self.request("/api/ai/chat", "POST", {"prompt": " "})
        self.assertEqual(response.status, 400)


if __name__ == "__main__":
    unittest.main()
