# Deploying TracSig

This project is a **React (Vite) frontend** and a **Flask + PostgreSQL backend**. Plan for:

- A **PostgreSQL** database (version 14+ recommended; 16 is used in Docker Compose below).
- A **Python 3.11+** environment for the API (see `backend/runtime.txt` if your host reads it).
- **Node.js 20+** (or current LTS) to build the frontend static assets.

---

## What you need to install

| Component | Purpose |
|-----------|---------|
| **PostgreSQL** | Primary database for users, courses, assignments, submissions, notifications. |
| **Python 3.11+** | Run the Flask API; install deps from `backend/requirements.txt`. |
| **Node.js + npm** | Build the frontend (`frontend/`). |
| **Docker Desktop** (optional) | Easiest way to run PostgreSQL locally via `docker-compose.yml`. |
| **gunicorn** | Already listed in `backend/requirements.txt`; use it to serve the API in production (not Flask’s dev server). |

On **Linux/VPS** production, you typically also use **nginx** (or Caddy) as a reverse proxy for HTTPS and to serve the built frontend or proxy to the API.

---

## PostgreSQL setup

### Option A: Docker Compose (recommended for local dev)

From the **repository root**:

```bash
docker compose up -d
```

This starts PostgreSQL 16 with:

- User / database: `tracsig`
- Password: `tracsig` (change for anything exposed beyond localhost)

Set in `backend/.env`:

```env
DATABASE_URL=postgresql://tracsig:tracsig@localhost:5432/tracsig
```

### Option B: Install PostgreSQL yourself

1. Install PostgreSQL for your OS.
2. Create a role and database, for example:

```sql
CREATE USER tracsig WITH PASSWORD 'your-strong-password';
CREATE DATABASE tracsig OWNER tracsig;
```

3. Set `DATABASE_URL` accordingly:

```env
DATABASE_URL=postgresql://tracsig:your-strong-password@localhost:5432/tracsig
```

### Managed databases (Railway, Render, AWS RDS, etc.)

Copy the connection string they provide into `DATABASE_URL`. If it starts with `postgres://`, the backend normalizes it to `postgresql://` automatically.

---

## Backend environment variables

Create `backend/.env` from `backend/.env.example`.

| Variable | Production notes |
|----------|------------------|
| `FLASK_ENV` | Set to `production`. |
| `SECRET_KEY` | Long random string; used by Flask. Generate e.g. `python -c "import secrets; print(secrets.token_hex(32))"`. |
| `JWT_SECRET_KEY` | Separate long random string for signing JWTs (can equal `SECRET_KEY` only if it is strong and random). |
| `DATABASE_URL` | PostgreSQL URL as above. |
| `CORS_ORIGINS` | Comma-separated list of **exact** frontend origins (e.g. `https://app.yourdomain.com`). No trailing path. |
| `TRUST_PROXY` | Set to `1` when the app sits behind nginx/Traefik and you terminate TLS at the proxy. |
| `ACCESS_TOKEN_EXPIRES` / `REFRESH_TOKEN_EXPIRES_DAYS` | Optional tuning for JWT lifetime. |

---

## First-time backend deploy

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
```

Set env vars (or load `.env` with a process manager that injects them).

```bash
export FLASK_ENV=production
export DATABASE_URL=postgresql://...
export SECRET_KEY=...
export JWT_SECRET_KEY=...
export CORS_ORIGINS=https://your-frontend-origin
```

Initialize tables **once** per database:

```bash
export FLASK_APP=wsgi:app
flask init-db
```

Optional demo data (development/staging only — **do not** run `seed-demo` on production with default passwords):

```bash
flask seed-demo
```

Run with **gunicorn** (Linux/macOS or WSL; not ideal on native Windows):

```bash
export PORT=8000
gunicorn --bind 0.0.0.0:${PORT} --workers 2 --threads 2 wsgi:app
```

Platforms like **Heroku / Railway / Render** can use the included `backend/Procfile` if you set the process `web` command to that file’s contents and configure `PORT` from the platform.

---

## Frontend build for production

When the SPA calls the real API, point it at your deployed API base URL using Vite env vars (see `frontend/.env.example`).

```bash
cd frontend
cp .env.example .env.production
# Edit VITE_API_BASE_URL to your public API URL, e.g. https://api.yourdomain.com/api
npm ci
npm run build
```

Deploy the contents of `frontend/dist/` behind your static host or nginx. The API must send CORS headers allowing your frontend origin (`CORS_ORIGINS` on the backend).

---

## Security checklist before going live

1. **HTTPS** everywhere (TLS at the proxy or host).
2. **Strong `SECRET_KEY` and `JWT_SECRET_KEY`** — never use example or dev defaults.
3. **Restrict `CORS_ORIGINS`** to your real frontend URL(s) only.
4. **PostgreSQL**: strong password, no public `0.0.0.0` exposure unless firewall rules are tight; prefer private network between app and DB.
5. Remove or rotate **demo accounts** if you ever ran `seed-demo` on a shared environment.
6. Keep **dependencies updated** (`pip` / `npm audit`) on a schedule.

---

## Schema changes over time

The project currently uses `flask init-db` (`db.create_all()`). For production evolution, consider adding **Alembic** migrations so you can alter tables without dropping data. That is optional follow-up work.

---

## Summary

- **Install:** PostgreSQL, Python 3.11+, Node.js; optional Docker for Postgres.
- **Configure:** `backend/.env` with production `FLASK_ENV`, secrets, `DATABASE_URL`, `CORS_ORIGINS`.
- **Run API:** gunicorn + `wsgi:app`, with `TRUST_PROXY=1` behind a reverse proxy.
- **Run SPA:** `npm run build` with `VITE_API_BASE_URL` set to your live API.

If you tell me your target host (e.g. Railway, VPS + nginx, Azure), the exact commands and env layout can be narrowed further.
