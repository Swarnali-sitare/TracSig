import os


def _admin_accounts_from_env() -> list[dict]:
    """Build ADMIN_ACCOUNTS from ADMIN_EMAIL / ADMIN_N_EMAIL (plus password or hash). No DB user row."""
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
    """Map postgres:// to postgresql:// for SQLAlchemy."""
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


class BaseConfig:
    # Production: set SECRET_KEY and JWT_SECRET_KEY (random, long).
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-tracsig-secret-min-32-chars-long-key")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", SECRET_KEY)
    _raw_db_url = os.environ.get(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/tracsig",
    )
    SQLALCHEMY_DATABASE_URI = _normalize_database_url(_raw_db_url)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
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
    # Default 55MB; per-file limits in assignment settings stay under this.
    MAX_CONTENT_LENGTH = int(os.environ.get("MAX_CONTENT_LENGTH", str(55 * 1024 * 1024)))

    # After batch end_date + this many days, `flask purge-batch-submissions` may delete submissions.
    BATCH_SUBMISSION_RETENTION_DAYS = int(os.environ.get("BATCH_SUBMISSION_RETENTION_DAYS", "30"))

    # ADMIN_ACCOUNTS: merged from legacy ADMIN_* and ADMIN_N_* env vars.
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
    """Return ProductionConfig or DevelopmentConfig from FLASK_ENV / ENV."""
    env = (os.environ.get("FLASK_ENV") or os.environ.get("ENV") or "development").lower()
    if env == "production":
        return ProductionConfig
    return DevelopmentConfig


Config = DevelopmentConfig  # alias
