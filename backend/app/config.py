import os


def _admin_accounts_from_env() -> list[dict]:
    """
    Env-only admin logins (no DB row). Each dict: email (lowercase), password (optional str), password_hash (optional str).
    Legacy: ADMIN_EMAIL + ADMIN_PASSWORD or ADMIN_PASSWORD_HASH.
    Numbered: ADMIN_1_EMAIL … ADMIN_20_EMAIL with ADMIN_N_PASSWORD or ADMIN_N_PASSWORD_HASH.
    """
    out: list[dict] = []
    ae = (os.environ.get("ADMIN_EMAIL") or "").strip().lower()
    ap = os.environ.get("ADMIN_PASSWORD")
    ah = (os.environ.get("ADMIN_PASSWORD_HASH") or "").strip()
    if ae and (ah or (ap is not None and ap != "")):
        out.append({"email": ae, "password": ap, "password_hash": ah or None})
    for i in range(1, 21):
        ae = (os.environ.get(f"ADMIN_{i}_EMAIL") or "").strip().lower()
        ap = os.environ.get(f"ADMIN_{i}_PASSWORD")
        ah = (os.environ.get(f"ADMIN_{i}_PASSWORD_HASH") or "").strip()
        if not ae:
            continue
        if ah or (ap is not None and ap != ""):
            out.append({"email": ae, "password": ap, "password_hash": ah or None})
    return out


def _normalize_database_url(url: str) -> str:
    """Railway/Heroku-style URLs use postgres://; SQLAlchemy expects postgresql://."""
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


class BaseConfig:
    # Required in production: set SECRET_KEY and JWT_SECRET_KEY to long random strings.
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-tracsig-secret-min-32-chars-long-key")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", SECRET_KEY)
    _raw_db_url = os.environ.get(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/tracsig",
    )
    SQLALCHEMY_DATABASE_URI = _normalize_database_url(_raw_db_url)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        # Pooling helps under Gunicorn multi-worker load (tune pool_size for your host).
        "pool_pre_ping": True,
        "pool_recycle": int(os.environ.get("SQLALCHEMY_POOL_RECYCLE", "280")),
    }
    ACCESS_TOKEN_EXPIRES = int(os.environ.get("ACCESS_TOKEN_EXPIRES", "900"))
    REFRESH_TOKEN_EXPIRES_DAYS = int(os.environ.get("REFRESH_TOKEN_EXPIRES_DAYS", "7"))
    CORS_ORIGINS = [
        o.strip()
        for o in os.environ.get(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,"
            "http://localhost:5174,http://127.0.0.1:5174",
        ).split(",")
        if o.strip()
    ]
    MAX_CONTENT_LENGTH = int(os.environ.get("MAX_CONTENT_LENGTH", str(2 * 1024 * 1024)))

    # Env-only admin login (no users table row). ADMIN_ACCOUNTS merges legacy + ADMIN_N_* vars.
    ADMIN_EMAIL = (os.environ.get("ADMIN_EMAIL") or "").strip().lower()
    ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD")
    ADMIN_PASSWORD_HASH = os.environ.get("ADMIN_PASSWORD_HASH")
    ADMIN_ACCOUNTS = _admin_accounts_from_env()


class DevelopmentConfig(BaseConfig):
    DEBUG = True
    TESTING = False


class ProductionConfig(BaseConfig):
    DEBUG = False
    TESTING = False


def get_config_class():
    """Select config from FLASK_ENV or ENV (production vs development)."""
    env = (os.environ.get("FLASK_ENV") or os.environ.get("ENV") or "development").lower()
    if env == "production":
        return ProductionConfig
    return DevelopmentConfig


# Default export for imports that expect `Config`
Config = DevelopmentConfig
