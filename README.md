# TracSig

TracSig is an interface for students and staff to track assignments.

## Requirements

- [Node.js](https://nodejs.org/) 18+ (LTS recommended)
- [npm](https://www.npmjs.com/) (comes with Node)

## Quick start

Install dependencies once in each package:

```bash
cd backend && npm install
cd ../frontend && npm install
```

### Backend (API)

1. Copy the example env file and set secrets:

   ```bash
   cd backend
   cp env.example .env
   ```

2. Edit `backend/.env` and set **`JWT_ACCESS_SECRET`** and **`JWT_REFRESH_SECRET`** to long random strings (at least 32 characters each). Other variables have sensible defaults for local development.

3. Start the dev server:

   ```bash
   npm run dev
   ```

The API listens on **http://localhost:4000** by default (`PORT` in `.env`).

- Health check: [http://localhost:4000/health](http://localhost:4000/health)
- Auth routes are under **`/api/auth`** (see `API_BASE_PATH` in `.env`, default `/api`).

`CORS_ORIGIN` defaults to `http://localhost:5173` so the Vite dev app can call the API with cookies when you wire the frontend to it.

### Frontend (Vite + React)

In a second terminal:

```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

The UI currently uses **mock authentication** (client-side) for login/register flows. Run the backend when you need the real HTTP API (e.g. testing auth with curl or after integrating the client).

## Production builds

**Frontend** — static assets in `frontend/dist/`:

```bash
cd frontend
npm run build
```

Serve `frontend/dist` with any static host or CDN. Set any `VITE_*` variables at build time if your app uses them.

**Backend** — compile and run:

```bash
cd backend
npm run build
npm start
```

Uses `node dist/index.js` and the same environment variables as development (set `NODE_ENV=production` and secure cookie settings as appropriate).

## More detail

For auth flow, architecture notes, and example `curl` requests against `/api/auth`, see [SETUP.md](./SETUP.md).
