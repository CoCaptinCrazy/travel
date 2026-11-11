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
                session=None,
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

    def test_github_models_is_used_when_gemini_fails(self):
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

        gemini.assert_called_once_with("Help me")
        self.assertEqual(response.body["data"]["reply"], "Fallback reply")
        self.assertEqual(response.body["data"]["provider"], "GitHub Copilot")

    def test_invalid_prompt_is_rejected(self):
        response = self.request("/api/ai/chat", "POST", {"prompt": " "})
        self.assertEqual(response.status, 400)


if __name__ == "__main__":
    unittest.main()
