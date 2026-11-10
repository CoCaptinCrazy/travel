import argparse
import sys

from backend.database import connect, initialize


def main():
    parser = argparse.ArgumentParser(description="Grant TravelX administrator access.")
    parser.add_argument("username", help="Existing account to promote")
    args = parser.parse_args()
    initialize()
    with connect() as db:
        cursor = db.execute(
            "UPDATE users SET role = 'admin' WHERE username = ? COLLATE NOCASE",
            (args.username,),
        )
    if cursor.rowcount != 1:
        print(f"No account found for {args.username!r}.", file=sys.stderr)
        return 1
    print(f"Administrator access granted to {args.username}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
