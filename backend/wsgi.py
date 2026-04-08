from pathlib import Path

# Prefer project venv (`./venv/bin/flask`) so deps match requirements.txt. If `python-dotenv`
# is missing (e.g. system Python), skip loading `.env` — set env vars in the shell instead.
try:
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parent / ".env", override=True)
except ImportError:
    pass

from app import create_app

app = create_app()