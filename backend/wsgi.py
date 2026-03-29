from pathlib import Path

from dotenv import load_dotenv

# Let backend/.env win over inherited shell vars (e.g. stray DATABASE_URL=sqlite from tests).
load_dotenv(Path(__file__).resolve().parent / ".env", override=True)

from app import create_app

app = create_app()