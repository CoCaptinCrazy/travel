import os
import tempfile
import unittest
from pathlib import Path

from backend.config import _load_env_file


class EnvFileTests(unittest.TestCase):
    def test_loads_values_without_overriding_process_environment(self):
        with tempfile.TemporaryDirectory() as tempdir:
            env_file = Path(tempdir) / ".env"
            env_file.write_text(
                "# local settings\nTRAVELX_PORT = 3001\nTRAVELX_HOST='127.0.0.2'\n",
                encoding="utf-8",
            )
            environ = {"TRAVELX_PORT": "4000"}

            _load_env_file(env_file, environ)

        self.assertEqual(environ["TRAVELX_PORT"], "4000")
        self.assertEqual(environ["TRAVELX_HOST"], "127.0.0.2")

    def test_rejects_malformed_entries(self):
        with tempfile.TemporaryDirectory() as tempdir:
            env_file = Path(tempdir) / ".env"
            env_file.write_text("not-an-assignment\n", encoding="utf-8")

            with self.assertRaisesRegex(ValueError, "line 1"):
                _load_env_file(env_file, {})

    def test_missing_env_file_is_allowed(self):
        with tempfile.TemporaryDirectory() as tempdir:
            _load_env_file(Path(tempdir) / ".env", os.environ)


if __name__ == "__main__":
    unittest.main()
