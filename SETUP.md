# Assignment Tracker – Auth System Setup

## 1. Folder tree

```
TracSig/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/
│   │   │   └── useRefreshToken.ts
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Signup.tsx
│   │   │   └── Unauthorized.tsx
│   │   ├── routes/
│   │   │   ├── index.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── services/
│   │   │   └── authService.ts
│   │   ├── styles/
│   │   │   ├── App.module.css
│   │   │   ├── Auth.module.css
│   │   │   ├── Home.module.css
│   │   │   └── Unauthorized.module.css
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   └── api.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── index.css
│   │   └── vite-env.d.ts
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   └── env.example
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── authController.ts
│   │   ├── middleware/
│   │   │   ├── authMiddleware.ts
│   │   │   └── roleMiddleware.ts
│   │   ├── models/
│   │   │   └── User.ts
│   │   ├── routes/
│   │   │   └── authRoutes.ts
│   │   ├── services/
│   │   │   └── authService.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── id.ts
│   │   │   └── jwt.ts
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── env.example
└── SETUP.md
```

## 2. Install commands

**Backend**

```bash
cd backend
npm install
```

**Frontend**

```bash
cd frontend
npm install
```

## 3. Config (environment)

- **Backend:** Copy `backend/env.example` to `backend/.env` and set `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (min 32 chars each). Other values have defaults.
- **Frontend:** Copy `frontend/env.example` to `frontend/.env`. For local dev with Vite proxy, `VITE_API_BASE_URL=/api` is enough (default in code). For a separate API origin, set e.g. `VITE_API_BASE_URL=http://localhost:4000/api`.

## 4. Run instructions

**Terminal 1 – backend**

```bash
cd backend
npm run dev
```

Server runs at `http://localhost:4000`. Auth API: `http://localhost:4000/api/auth`.

**Terminal 2 – frontend**

```bash
cd frontend
npm run dev
```

App runs at `http://localhost:5173`. Vite proxies `/api` to `http://localhost:4000`, so no CORS issues in dev.

**Flow**

1. Open `http://localhost:5173`.
2. Sign up (name, email, password, confirm password, role).
3. Log in with the same email/password → redirect to `/home`.
4. Home shows name and role; Logout clears session and cookie.

## 5. Example API test requests

Base URL: `http://localhost:4000/api/auth` (or `http://localhost:5173/api/auth` when using proxy).

**Signup**

```bash
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","password":"secret123","role":"Student"}'
```

**Login** (capture `accessToken` from response; cookie is set automatically in browser)

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"secret123"}' \
  -c cookies.txt -b cookies.txt -v
```

**Me** (use token from login)

```bash
curl -X GET http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Refresh** (uses cookie; with curl use `-b cookies.txt` after login)

```bash
curl -X POST http://localhost:4000/api/auth/refresh \
  -b cookies.txt
```

**Logout**

```bash
curl -X POST http://localhost:4000/api/auth/logout \
  -b cookies.txt
```

## 6. Architecture decisions

- **Frontend/backend split:** Clear separation; frontend only talks to backend via `/api` and fetch; no server-side rendering.
- **Tokens:** Access token in memory (AuthContext); refresh token in httpOnly cookie set by backend. Reduces XSS impact and keeps refresh token off JS.
- **Auth context:** Single place for user, role, accessToken, login, signup, logout, refresh. Protected routes and API calls use the same token source.
- **Protected routes:** `ProtectedRoute` checks `accessToken`; if missing, redirects to `/login` and stores `from` for post-login redirect.
- **Auto refresh:** On load, if there is no access token, the app calls `/auth/refresh` once (cookie sent with `credentials: 'include'`). When access token exists, a 14-minute interval calls refresh so a 15-minute access expiry is covered.
- **API layer:** `authService` and `apiFetch` centralize base URL, `Authorization` header, and `credentials: 'include'` for cookies.
- **Backend structure:** Routes → controllers → services → models/utils. Auth middleware verifies JWT and attaches payload to `req.user`; role middleware can restrict by role when needed.
- **User store:** In-memory map for demo; replace with a DB (e.g. Prisma/TypeORM) and persistent sessions in production.
- **Validation:** Signup validated on backend (name, email, password length, role enum); frontend does client-side validation for UX.
- **Strict TypeScript:** No `any`; shared types (User, UserRole, etc.) aligned between frontend and backend for safety and refactoring.
