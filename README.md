# TracSig

TracSig helps students and faculty keep track of assignments in one place.

---

## What you need on your computer

- **Python 3.11+** (for the Flask API in `backend/`)
- **Node.js 18+** and **npm** (for the Vite/React app in `frontend/`)

Install Node from [https://nodejs.org](https://nodejs.org) (LTS). Check with `node --version` and `python3 --version`.

---

## Authentication (closed system)

There is **no public registration**. Users cannot create their own accounts from the UI.

| Role | How login works |
|------|------------------|
| **Admin** | One or more accounts from **environment** variables: legacy `ADMIN_EMAIL` / `ADMIN_PASSWORD` (or `ADMIN_PASSWORD_HASH`), and/or numbered `ADMIN_1_EMAIL` … `ADMIN_20_EMAIL` with matching `_PASSWORD` or `_PASSWORD_HASH`. No admin row is required in the database. |
| **Student** | Email must exist in the **`students`** table and the password must match the stored hash. A linked shadow row in **`users`** is used for JWTs and LMS APIs. |
| **Faculty** | Email must exist in the **`faculty`** table with a matching password hash, plus a linked shadow **`users`** row (`Staff`). |

Login order on the server: env admin → student → faculty; otherwise **401** with **Invalid credentials**.

### Admin credentials (`.env`)

Add to `backend/.env` (see `backend/.env.example`). Example with multiple admins:

```env
ADMIN_1_EMAIL=admin1@example.com
ADMIN_1_PASSWORD=your-secret
ADMIN_2_EMAIL=admin2@example.com
ADMIN_2_PASSWORD=other-secret
```

You can still use a single **`ADMIN_EMAIL`** / **`ADMIN_PASSWORD`** (or **`ADMIN_PASSWORD_HASH`**) instead. For production, prefer strong passwords or per-slot **`ADMIN_N_PASSWORD_HASH`** from `werkzeug.security.generate_password_hash()`.

---

## How to run TracSig (two terminals)

### Step 1 — Install dependencies (once)

**Backend** (virtual environment recommended):

```bash
cd backend
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
cp .env.example .env
```

Edit `backend/.env`: set **`SECRET_KEY`**, **`JWT_SECRET_KEY`** (long random strings), **`DATABASE_URL`**, at least one env admin (`ADMIN_1_EMAIL` / `ADMIN_1_PASSWORD` or legacy `ADMIN_EMAIL` / `ADMIN_PASSWORD`), and **`CORS_ORIGINS`** if needed.

After model or column changes, align the database:

```bash
./venv/bin/flask sync-schema
```

That command also drops legacy `department` columns from `users`, `faculty`, and `courses` when they still exist from older schemas.

Optional demo rows (batches, faculty, student, course):

```bash
./venv/bin/flask seed-demo
```

**Frontend:**

```bash
cd ../frontend
npm install
cp .env.example .env
```

Ensure `VITE_API_BASE_URL` in `frontend/.env` points at your API (default `http://127.0.0.1:5000/api`).

---

### Step 2 — Start the API (terminal A)

```bash
cd backend
./venv/bin/flask run --host 127.0.0.1 --port 5000 --reload
```

Check [http://127.0.0.1:5000/api/health](http://127.0.0.1:5000/api/health) for a healthy response.

---

### Step 3 — Start the website (terminal B)

```bash
cd frontend
npm run dev
```

Open the URL shown (usually **http://localhost:5173**). Use the **Login** page only; sign-up is not available.

---

### Quick checklist

| Step | Action |
|------|--------|
| 1 | Python venv + `pip install -r requirements.txt` in `backend` |
| 2 | Copy `backend/.env.example` → `backend/.env` and configure DB, JWT secrets, **admin env vars** |
| 3 | `flask sync-schema` (and `flask seed-demo` if you want sample data) |
| 4 | `flask run` on port **5000** |
| 5 | `npm install` and `npm run dev` in `frontend` |
| 6 | Browser: SPA on **5173**, API on **5000** |

---

## If something goes wrong

- **Database errors after a pull:** Run `./venv/bin/flask sync-schema` again; for SQLite with heavy drift, recreate the DB with `flask init-db` if your project documents that command.
- **CORS errors:** Add your frontend origin to **`CORS_ORIGINS`** in `backend/.env`.
- **401 on login:** Confirm admin env vars, or that the student/faculty email exists in the correct table with a valid password hash.

---

## Optional: production build

- **Frontend:** `cd frontend && npm run build` → output in `frontend/dist`.
- **API:** serve `wsgi:app` with **gunicorn** (or similar) behind HTTPS; set `FLASK_ENV=production` and strong secrets.

---

## More technical details

Role strings from the API (`Student`, `Staff`, `Admin`) are mapped in the SPA via [`frontend/src/app/types/apiRoles.ts`](frontend/src/app/types/apiRoles.ts). API shape notes: [backend-api-requirements.md](./backend-api-requirements.md). Older step-by-step auth notes in [SETUP.md](./SETUP.md) may not match the current Python layout.
