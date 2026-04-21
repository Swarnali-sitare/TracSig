# Deploying TracSig

This document is for **running TracSig on a server** (staging or production), not for day-to-day coding on your laptop. For a **local setup**, start with [README.md](./README.md).

TracSig is a **React (Vite) front end** talking to a **Flask API** backed by **PostgreSQL**. In production you typically:

1. Run PostgreSQL somewhere safe.
2. Run the API with a production WSGI server (**gunicorn**), not Flask’s built-in dev server.
3. Build the front end to static files and serve them with **nginx** (or similar), or host `frontend/dist/` on any static host.
4. Lock down secrets, HTTPS, and CORS.

---

## What to have ready

| Piece | Role |
|-------|------|
| **PostgreSQL 14+** | Stores users, courses, assignments, etc. (Compose in this repo uses 16.) |
| **Python 3.11+** | Runs `backend/`; install dependencies with `pip install -r requirements.txt`. |
| **Node.js** (current LTS is fine) | Only needed on the machine where you **build** the front end (`npm run build`). The server usually serves plain HTML/JS/CSS from `frontend/dist/`. |
| **gunicorn** | Listed in `backend/requirements.txt` — use it to serve `wsgi:app`. |
| **Docker** (optional) | Easiest way to run PostgreSQL locally using `docker-compose.yml` at the repo root. |

Behind TLS you’ll often put **nginx** or **Caddy** in front of gunicorn and the static site.

---

## PostgreSQL

### Option A: Docker Compose (handy for local or small setups)

From the **repository root**:

```bash
docker compose up -d
```

That starts PostgreSQL with user/database **`tracsig`** / password **`tracsig`** (change anything that faces the internet).

In `backend/.env`:

```env
DATABASE_URL=postgresql://tracsig:tracsig@localhost:5432/tracsig
```

### Option B: Your own PostgreSQL install

Create a role and database, then set `DATABASE_URL` to match, for example:

```env
DATABASE_URL=postgresql://tracsig:your-strong-password@localhost:5432/tracsig
```

### Managed databases (Railway, Render, RDS, …)

Paste the connection string they give you into **`DATABASE_URL`**. If it starts with `postgres://`, this app rewrites it to `postgresql://` for SQLAlchemy.

---

## Backend: environment variables

Copy `backend/.env.example` to `backend/.env` and set at least:

| Variable | What to use in production |
|----------|---------------------------|
| `FLASK_ENV` | `production` |
| `SECRET_KEY` | Long random string (Flask). Example: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `JWT_SECRET_KEY` | Another long random string used to sign JWTs (can match `SECRET_KEY` only if both are strong random values). |
| `DATABASE_URL` | Full PostgreSQL URL as above. |
| `CORS_ORIGINS` | Comma-separated **exact** origins of your SPA, e.g. `https://app.example.com` — no trailing path. |
| `TRUST_PROXY` | Set to `1` if the app sits behind nginx/Traefik and you rely on `X-Forwarded-*` for HTTPS/client IP. |
| Admin accounts | Same `ADMIN_1_EMAIL` / `ADMIN_1_PASSWORD` (or hashed) pattern as in the README — never commit real passwords. |

Optional: `ACCESS_TOKEN_EXPIRES`, `REFRESH_TOKEN_EXPIRES_DAYS` to tune JWT lifetime.

---

## Backend: first deploy steps

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate
pip install -r requirements.txt
```

Load your env (`.env` or your host’s secret manager), then one-time per database:

```bash
export FLASK_APP=wsgi:app
flask init-db
flask sync-schema
```

Do **not** run `flask seed-demo` on production with default passwords. Use it only on dev/staging if you want demo accounts.

Run the API with gunicorn (Linux/macOS/WSL; native Windows is awkward for gunicorn):

```bash
export PORT=8000
gunicorn --bind 0.0.0.0:${PORT} --workers 2 --threads 2 wsgi:app
```

Many hosts read `PORT` from the environment and expect a `Procfile` — this repo includes `backend/Procfile` you can adapt.

---

## Front end: build for production

Point the built site at your **public API**. In `frontend/.env.production` (or your host’s UI):

```env
VITE_API_URL=https://your-api-host.example.com
```

No trailing slash. Paths like `/api/auth/login` are appended by the app.

Then:

```bash
cd frontend
npm ci
npm run build
```

Upload **`frontend/dist/`** to your static host or nginx `root`. The API must send **`Access-Control-Allow-Origin`** for your SPA origin — that’s what **`CORS_ORIGINS`** on the backend controls.

---

## Security before you go live

1. Serve everything over **HTTPS**.
2. Use **strong, unique** `SECRET_KEY` and `JWT_SECRET_KEY` — not the dev defaults.
3. Set **`CORS_ORIGINS`** only to your real front-end URL(s).
4. Lock down PostgreSQL (strong password, private network when possible).
5. Remove or rotate **demo** accounts if you ever ran `seed-demo` on a shared environment.
6. Keep **Python and npm dependencies** updated; run `pip` / `npm audit` on a schedule.

---

## Schema changes

Today, tables are created with **`flask init-db`** / **`sync-schema`**. For frequent production changes without losing data, many teams add **Alembic** migrations later — that’s optional follow-up work.

---

## Summary

| Goal | Action |
|------|--------|
| Database | PostgreSQL + `DATABASE_URL` |
| API | `gunicorn` + `wsgi:app`, production env vars, `TRUST_PROXY=1` behind a reverse proxy |
| Front end | `npm run build`, deploy `dist/`, set `VITE_API_URL` to the live API origin |

For host-specific steps (Railway, VPS + nginx, Azure, …), follow that provider’s docs for environment variables, TLS, and process binding.
