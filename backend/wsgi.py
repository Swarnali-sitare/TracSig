from pathlib import Path

# Load backend/.env when python-dotenv is installed; otherwise export vars in the shell.
try:
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parent / ".env", override=True)
except ImportError:
    pass

from app import create_app

app = create_app()