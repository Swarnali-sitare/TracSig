# TracSig

TracSig is a small web app for **assignment tracking**: students see and submit work, faculty create and grade assignments, and admins manage users, courses, and batches.

You run **two processes** on your machine: a **Python backend** (REST API) and a **JavaScript frontend** (the website). This guide assumes you’re comfortable using a terminal, editing a `.env` file, and installing Node and Python.

---

## What you need installed

| Tool | Why |
|------|-----|
| **Python 3.11+** | Runs the API in `backend/` |
| **Node.js 18+** and **npm** | Builds and runs the UI in `frontend/` |
| **PostgreSQL** | Database (local install, or Docker via `docker compose` in the repo root — see [DEPLOYMENT.md](./DEPLOYMENT.md)) |

Check versions:

```bash
python3 --version
node --version
npm --version
```

Install Node from [nodejs.org](https://nodejs.org) (LTS is fine).

---

## How login works (no public sign-up)

There is **no “Create account”** on the site. Who can log in is controlled by **your server config** and **your database**.

| Who | What has to be true |
|-----|---------------------|
| **Admin** | You put at least one admin email + password in `backend/.env` (`ADMIN_1_EMAIL` / `ADMIN_1_PASSWORD`, or the older single `ADMIN_EMAIL` / `ADMIN_PASSWORD`). Admins are **not** stored as users in the database for login. |
| **Student** | A row exists in the **`students`** table (and a linked **`users`** row) with that email and a password hash. Admins create these through the app. |
| **Faculty** | Same idea: **`faculty`** + linked **`users`** row with role Staff. |

If email/password don’t match any of the above, login returns **Invalid credentials**.

---

## Run the app locally (first time)

### 1. Get the code and create the backend environment

```bash
cd backend
python3 -m venv venv
```

**Windows:** use `venv\Scripts\activate` instead of `source` below.

**Linux / macOS:**

```bash
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edit **`backend/.env`** in a text editor. Set at least:

- **`SECRET_KEY`** and **`JWT_SECRET_KEY`** — long random strings (the app uses them for sessions and JWT signing). You can generate something like:  
  `python3 -c "import secrets; print(secrets.token_hex(32))"`  
  Run twice and paste two different values.
- **`DATABASE_URL`** — connection string for PostgreSQL. If you use Docker Compose from the repo root (`docker compose up -d`), the example URL in `.env.example` often works as-is.
- **At least one admin** — e.g.  
  `ADMIN_1_EMAIL=you@example.com` and `ADMIN_1_PASSWORD=a-strong-password`
- **`CORS_ORIGINS`** — for local dev, include your frontend origin, e.g.  
  `http://localhost:5173,http://127.0.0.1:5173`

Create tables and apply schema updates. From **`backend/`** (this folder has `.flaskenv`, so Flask already knows about `wsgi:app`):

```bash
# With venv activated, or: ./venv/bin/flask ... on Linux/macOS
flask init-db
flask sync-schema
```

Optional: load **demo** data (fake faculty/student/course — useful to click around):

```bash
flask seed-demo
```

(Use the credentials printed in the terminal; don’t use demo passwords in production.)

---

### 2. Install and configure the frontend

In a **second** terminal:

```bash
cd frontend
npm install
cp .env.example .env
```

Edit **`frontend/.env`**. Set **`VITE_API_URL`** to the **origin** of your API (no path after the port). For a normal local setup:

```env
VITE_API_URL=http://127.0.0.1:5000
```

The app builds request paths like `/api/...` on top of that URL, so do **not** add `/api` to `VITE_API_URL` unless your code is configured for that pattern.

---

### 3. Start the API (terminal 1)

```bash
cd backend
source venv/bin/activate   # skip if already active
flask run --host 127.0.0.1 --port 5000 --reload
```

Open [http://127.0.0.1:5000/api/health](http://127.0.0.1:5000/api/health) — you should see a JSON response, not an error page.

---

### 4. Start the website (terminal 2)

```bash
cd frontend
npm run dev
```

Open the URL Vite prints (usually **http://localhost:5173**). Log in with an admin you defined in `backend/.env`, or with demo users if you ran `seed-demo`.

---

## Quick checklist

1. PostgreSQL running and `DATABASE_URL` correct in `backend/.env`
2. `SECRET_KEY`, `JWT_SECRET_KEY`, and at least one `ADMIN_*` pair set
3. From `backend/`: `flask init-db` and `flask sync-schema` once (repeat `sync-schema` after big pulls if models changed)
4. `flask run` on port **5000**
5. `frontend/.env` has `VITE_API_URL=http://127.0.0.1:5000` (or your actual API origin)
6. `npm run dev` for the frontend

---

## If something goes wrong

| Problem | What to try |
|---------|-------------|
| **Database / “relation does not exist”** | From `backend/`, run `flask init-db` and `flask sync-schema` again. |
| **CORS error in the browser** | Add your exact frontend URL (including `http://` and port) to **`CORS_ORIGINS`** in `backend/.env`, restart the API. |
| **401 on login** | For admin: check `ADMIN_*` in `.env` and restart Flask. For student/faculty: that email must exist in the DB with a valid password (created by an admin). |
| **Frontend can’t reach the API** | Confirm the API is running, `VITE_API_URL` matches (no typo, correct port), and nothing else is blocking localhost. |

---

## Production build (short)

- **Frontend:** `cd frontend && npm run build` — static files go to `frontend/dist/`.
- **API:** run with **gunicorn** (see [DEPLOYMENT.md](./DEPLOYMENT.md)), set `FLASK_ENV=production`, use strong secrets and HTTPS.

---

## Further reading

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** — Postgres, Docker, gunicorn, env vars for a live server.

Role names: the API uses `Student`, `Staff`, and `Admin`; the React app maps them in [`frontend/src/app/types/apiRoles.ts`](frontend/src/app/types/apiRoles.ts).
