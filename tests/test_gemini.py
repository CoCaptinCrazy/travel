import io
import json
import unittest
from unittest.mock import patch

from backend.services.gemini import GeminiProviderError, generate


class GeminiServiceTests(unittest.TestCase):
    def test_sends_prompt_with_api_key_header_and_extracts_reply(self):
        response = io.BytesIO(
            json.dumps(
                {"candidates": [{"content": {"parts": [{"text": "A useful reply"}]}}]}
            ).encode("utf-8")
        )
        with patch("backend.services.gemini.urlopen", return_value=response) as urlopen:
            reply = generate("A prompt", "test-api-key")

        request = urlopen.call_args.args[0]
        self.assertEqual(reply, "A useful reply")
        self.assertEqual(request.get_header("X-goog-api-key"), "test-api-key")
        self.assertNotIn("test-api-key", request.full_url)

    def test_rejects_empty_provider_response(self):
        response = io.BytesIO(b'{"candidates":[{"content":{"parts":[]}}]}')
        with patch("backend.services.gemini.urlopen", return_value=response):
            with self.assertRaisesRegex(GeminiProviderError, "empty response"):
                generate("A prompt", "test-api-key")


if __name__ == "__main__":
    unittest.main()
