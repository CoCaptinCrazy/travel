import unittest

from backend.routes.browser import valid_web_url
from backend.services.search_service import destination_for
from backend.models.user import hash_password, verify_password


class SearchServiceTests(unittest.TestCase):
    def test_search_terms_use_search_engine(self):
        self.assertEqual(
            destination_for("hello travelx"),
            "https://www.google.com/search?q=hello+travelx",
        )

    def test_domain_is_opened_directly(self):
        self.assertEqual(destination_for("example.com"), "https://example.com")

    def test_local_host_port_is_opened_directly(self):
        self.assertEqual(destination_for("localhost:3000"), "https://localhost:3000")

    def test_non_web_schemes_are_rejected(self):
        with self.assertRaises(ValueError):
            destination_for("javascript:alert(1)")

    def test_invalid_port_is_rejected(self):
        with self.assertRaises(ValueError):
            destination_for("example.com:99999")


class BrowserURLTests(unittest.TestCase):
    def test_only_http_and_https_addresses_are_valid(self):
        self.assertTrue(valid_web_url("https://example.com/path"))
        self.assertTrue(valid_web_url("http://localhost:3000"))
        self.assertFalse(valid_web_url("javascript:alert(1)"))
        self.assertFalse(valid_web_url("https://example.com:99999"))
        self.assertFalse(valid_web_url("https://user:password@example.com"))


class PasswordHashTests(unittest.TestCase):
    def test_password_hash_is_salted_and_verified(self):
        salt, password_hash = hash_password("a-long-example-password")
        self.assertTrue(verify_password("a-long-example-password", salt, password_hash))
        self.assertFalse(verify_password("different-password", salt, password_hash))


if __name__ == "__main__":
    unittest.main()
