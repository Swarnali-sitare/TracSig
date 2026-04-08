# TracSig Backend API Requirements

This document is derived from the TracSig React SPA (`frontend/`). The UI currently uses **mock data and `setTimeout` simulations**; there are no production API calls. It is intended for a **Python 3 / Flask / PostgreSQL** implementation. **JWT** access and refresh tokens are assumed unless otherwise noted.

**Frontend ↔ backend naming**

| SPA (routes / `AuthContext`) | Proposed API role string | API route prefix |
|------------------------------|---------------------------|------------------|
| `student`                    | `Student`                 | `/api/student`   |
| `faculty`                    | `Staff`                   | `/api/staff`     |
| `admin`                      | `Admin`                   | `/api/admin`     |

The file `frontend/src/app/types/apiRoles.ts` maps `faculty` ↔ legacy `Teacher` / `Staff` in JWT payloads. New backends should standardize on **`Staff`** (not `Teacher`) in the database and JWT `role` claim, while accepting legacy `Teacher` during a transition period and normalizing in middleware.

---

## 1. System Overview

- **Product:** TracSig — assignment tracking for students, creation/evaluation for staff, and org management for admins.
- **Clients:** Single-page app (Vite/React), role-based areas: `/student/*`, `/faculty/*` (legacy `/staff/*` redirects to faculty), `/admin/*`, `/auth/*`.
- **Auth:** **Closed system** — there is no public self-signup. **Login** only: admin credentials come from server environment (`ADMIN_EMAIL` / `ADMIN_PASSWORD` or `ADMIN_PASSWORD_HASH`); students and faculty must already exist in the database with matching password hashes. The SPA stores tokens in `localStorage`; production may use **HTTP-only cookies** and/or **Authorization: Bearer** with short-lived access JWT and refresh rotation.
- **Core flows:** Admin maintains students, staff (faculty), courses, batches; staff creates assignments tied to courses; students see assignments filtered by active/closed (due date vs today in **local calendar day**); students save **server-side drafts** and submit text; staff lists submissions and evaluates after due date (UI blocks evaluate before due date); notifications in header (list, mark read, clear).
- **Date rules:** Student assignment **display** status matches `frontend/src/app/utils/assignmentStatus.ts`: **Completed** = submitted; **Pending** = not submitted and due date ≥ today (due today counts as not passed); **Incomplete** = not submitted and due date before today. Backend should expose raw `due_date`, `submission_status`, and optionally a computed `display_status` for convenience.

---

## 2. User Roles

| Role    | Permissions (summary) |
|---------|-------------------------|
| Student | Own profile; list/view assignments for enrolled courses; draft/submit own submissions; read own notifications; student dashboard aggregates. |
| Staff   | Own profile; CRUD own assignments for assigned courses; list submissions for those assignments; evaluate (marks 0–100, feedback); student progress and staff dashboard. |
| Admin   | Full CRUD students and staff users; CRUD courses; list/create batches; admin dashboard; all admin notifications as needed. |

**Authorization:** Every non-auth endpoint requires a valid access JWT with `role` and `sub` (user id). Enforce row-level rules (e.g., staff only assignments where `assignment.staff_id = current_user.id` unless policy extends).

---

## 3. Database Schema (PostgreSQL DDL)

```sql
-- Extensions (optional; use gen_random_uuid() if preferred)
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM ('Student', 'Staff', 'Admin');

CREATE TABLE batches (
  id          BIGSERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  year_label  VARCHAR(32)  NOT NULL,  -- e.g. "2023", "2024"
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (name, year_label)
);

CREATE TABLE users (
  id              BIGSERIAL PRIMARY KEY,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   TEXT         NOT NULL,
  full_name       VARCHAR(255) NOT NULL,
  role            user_role    NOT NULL,
  teaching_load_hours SMALLINT CHECK (teaching_load_hours IS NULL OR (teaching_load_hours >= 1 AND teaching_load_hours <= 20)),
  batch_id        BIGINT REFERENCES batches (id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT chk_student_batch CHECK (role <> 'Student' OR batch_id IS NOT NULL),
  CONSTRAINT chk_admin_batch_null CHECK (role <> 'Admin' OR batch_id IS NULL)
);

CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_batch ON users (batch_id) WHERE batch_id IS NOT NULL;

CREATE TABLE courses (
  id           BIGSERIAL PRIMARY KEY,
  code         VARCHAR(32)  NOT NULL UNIQUE,
  name         VARCHAR(255) NOT NULL,
  credits      SMALLINT      NOT NULL CHECK (credits >= 1 AND credits <= 6),
  staff_id     BIGINT       NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_courses_staff ON courses (staff_id);

-- Which courses a batch takes (drives which assignments a student sees)
CREATE TABLE batch_courses (
  batch_id   BIGINT NOT NULL REFERENCES batches (id) ON DELETE CASCADE,
  course_id  BIGINT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  PRIMARY KEY (batch_id, course_id)
);

CREATE TABLE assignments (
  id           BIGSERIAL PRIMARY KEY,
  title        VARCHAR(500) NOT NULL,
  description  TEXT         NOT NULL,
  course_id    BIGINT       NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  staff_id     BIGINT       NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  due_date     DATE         NOT NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_assignments_course ON assignments (course_id);
CREATE INDEX idx_assignments_staff ON assignments (staff_id);
CREATE INDEX idx_assignments_due ON assignments (due_date);

CREATE TYPE submission_status AS ENUM ('draft', 'submitted', 'evaluated');

CREATE TABLE submissions (
  id             BIGSERIAL PRIMARY KEY,
  assignment_id  BIGINT NOT NULL REFERENCES assignments (id) ON DELETE CASCADE,
  student_id     BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  content        TEXT,
  status         submission_status NOT NULL DEFAULT 'draft',
  marks          SMALLINT CHECK (marks IS NULL OR (marks >= 0 AND marks <= 100)),
  feedback       TEXT,
  submitted_at   TIMESTAMPTZ,
  evaluated_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, student_id)
);

CREATE INDEX idx_submissions_student ON submissions (student_id);
CREATE INDEX idx_submissions_assignment ON submissions (assignment_id);
CREATE INDEX idx_submissions_status ON submissions (status);

CREATE TABLE notifications (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type        VARCHAR(64) NOT NULL,
  title       VARCHAR(255) NOT NULL,
  message     TEXT NOT NULL,
  icon_key    VARCHAR(32) NOT NULL DEFAULT 'bell'
    CHECK (icon_key IN ('bell', 'alert', 'check', 'info')),
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications (user_id);
CREATE INDEX idx_notifications_unread ON notifications (user_id) WHERE NOT is_read;

-- Optional: refresh token store for rotation
CREATE TABLE refresh_tokens (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  jti         UUID NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_user ON refresh_tokens (user_id);
```

**Enrollment note:** Student visibility of assignments: student’s `batch_id` → `batch_courses` → `course_id` → `assignments.course_id`. Staff visibility: assignments where `staff_id = current user` or courses they teach (`courses.staff_id`).

---

## 4. API Specifications (summary table)

Base URL: `/api`. All JSON bodies/responses use `Content-Type: application/json`. IDs are integers unless migrated to UUID.

| Method | Path | Auth | Role |
|--------|------|------|------|
| POST | `/api/auth/login` | No | — |
| POST | `/api/auth/logout` | Refresh/access | Any |
| POST | `/api/auth/refresh` | Refresh body/cookie | Any |
| GET | `/api/auth/me` | Bearer | Any |
| PATCH | `/api/auth/me` | Bearer | Any |
| PUT | `/api/auth/password` | Bearer | Any |
| GET | `/api/student/assignments` | Bearer | Student |
| GET | `/api/student/assignments/:id` | Bearer | Student |
| POST | `/api/student/assignments/:id/draft` | Bearer | Student |
| POST | `/api/student/assignments/:id/submit` | Bearer | Student |
| GET | `/api/student/dashboard` | Bearer | Student |
| GET | `/api/student/submissions` | Bearer | Student |
| POST | `/api/staff/assignments` | Bearer | Staff |
| GET | `/api/staff/assignments` | Bearer | Staff |
| GET | `/api/staff/assignments/:id` | Bearer | Staff |
| PUT | `/api/staff/assignments/:id` | Bearer | Staff |
| DELETE | `/api/staff/assignments/:id` | Bearer | Staff |
| GET | `/api/staff/submissions` | Bearer | Staff |
| POST | `/api/staff/submissions/:id/evaluate` | Bearer | Staff |
| GET | `/api/staff/students/progress` | Bearer | Staff |
| GET | `/api/staff/dashboard` | Bearer | Staff |
| GET | `/api/admin/students` | Bearer | Admin |
| POST | `/api/admin/students` | Bearer | Admin |
| GET | `/api/admin/students/:id` | Bearer | Admin |
| DELETE | `/api/admin/students/:id` | Bearer | Admin |
| GET | `/api/admin/staff` | Bearer | Admin |
| POST | `/api/admin/staff` | Bearer | Admin |
| GET | `/api/admin/staff/:id` | Bearer | Admin |
| DELETE | `/api/admin/staff/:id` | Bearer | Admin |
| GET | `/api/admin/courses` | Bearer | Admin |
| POST | `/api/admin/courses` | Bearer | Admin |
| GET | `/api/admin/courses/:id` | Bearer | Admin |
| DELETE | `/api/admin/courses/:id` | Bearer | Admin |
| GET | `/api/admin/batches` | Bearer | Admin |
| POST | `/api/admin/batches` | Bearer | Admin |
| GET | `/api/notifications` | Bearer | Any |
| PATCH | `/api/notifications/:id/read` | Bearer | Owner |
| PATCH | `/api/notifications/read-all` | Bearer | Owner |
| DELETE | `/api/notifications/:id` | Bearer | Owner |
| DELETE | `/api/notifications` | Bearer | Owner |

Detailed request/response shapes are in subsections under section 4 below.

### 4.1 Student assignment list item (`GET /api/student/assignments`)

Query: `?scope=active|closed` — **active:** `due_date >= today`; **closed:** `due_date < today`.

```json
{
  "items": [
    {
      "id": 1,
      "title": "string",
      "course_code": "CS201",
      "due_date": "2026-04-05",
      "record_status": "pending",
      "submitted_on": "2026-03-20",
      "description": "string",
      "display_status": "Pending"
    }
  ]
}
```

`record_status`: `pending` = no submission or draft only; `completed` = submitted or evaluated (matches `SubmissionRecordStatus` in mock). Alternatively expose `submission_status` enum and let client compute display.

### 4.2 `GET /api/student/assignments/:id`

Full detail for assignment work page: includes `description`, `due_date`, `display_status`, `is_submitted`, `submitted_on`, `content` (last saved draft or submitted text if evaluated/submitted).

### 4.3 `GET /api/student/submissions`

Recent history for dashboard/lists: paginated `?limit=20&offset=0`.

### 4.4 Staff submissions row (`GET /api/staff/submissions`)

```json
{
  "items": [
    {
      "id": 1,
      "student_name": "string",
      "assignment_title": "string",
      "course_code": "CS201",
      "submitted_on": "2026-03-10",
      "due_date": "2026-03-10",
      "evaluation_status": "pending",
      "marks": 85,
      "content": "string preview or full"
    }
  ]
}
```

`evaluation_status`: `pending` (submitted, not evaluated) | `evaluated`.

### 4.5 `POST /api/staff/submissions/:id/evaluate`

**Body:** `{ "marks": 0-100, "feedback": "string" }`. **422** if marks invalid or feedback empty (matches UI). **403** if before due date per policy.

### 4.6 `GET /api/staff/students/progress`

Query: `?course=CS201|all`. Rows:

```json
{
  "items": [
    {
      "student_id": 1,
      "name": "string",
      "batch": "2023",
      "course_code": "CS201",
      "assignments_submitted": 18,
      "total_assignments": 20,
      "completion_rate": 90,
      "last_activity": "2026-03-14",
      "trend": "up"
    }
  ],
  "summary": {
    "average_completion_rate": 80,
    "students_above_80_percent": 3,
    "students_total": 5,
    "students_need_attention": 1
  }
}
```

`trend`: compare last two weeks submission counts (simple up/down).

### 4.7 Admin students

**`GET /api/admin/students`** — Query: `?batch=2023|all&search=`. Row: `id`, `name`, `email`, `batch`, `progress_percent` (computed from submissions).

**`POST /api/admin/students`:** `{ "name", "email", "password", "batch_id" }` — creates `Student` role user.

**`DELETE /api/admin/students/:id`** — hard delete or soft delete; block if FK conflicts.

### 4.8 Admin staff

**`GET /api/admin/staff`:** Row: `id`, `name`, `email`, `courses` (codes array), `teaching_load_hours`.

**`POST /api/admin/staff`:** `{ "name", "email", "password", "teaching_load_hours" }`.

### 4.9 Admin courses

**`GET /api/admin/courses`:** rows with `code`, `name`, `credits`, `enrolled_students` (count), `instructor_name`, `instructor_id`.

**`POST /api/admin/courses`:** `{ "code", "name", "credits", "staff_id" }`.

**`DELETE /api/admin/courses/:id`** — reject if assignments exist or return cascade policy.

### 4.10 Admin batches

**`GET /api/admin/batches`** — list id, name, year_label.

**`POST /api/admin/batches`:** `{ "name", "year_label" }`. Optionally body includes `course_ids: []` to populate `batch_courses`.

---

## 5. Dashboard Data APIs (aggregation)

Backends should return structures that can feed the existing charts without UI changes once wired.

### 5.1 `GET /api/student/dashboard`

**Purpose:** Match `StudentDashboard.tsx` stats and widgets.

**Aggregates:**

- **Stats:** `total_assignments`, `completed`, `pending`, `incomplete` — same semantics as `countAssignmentStats` / `getStudentAssignmentDisplayStatus` over all assignments visible to the student.
- **Weekly completion:** Array `{ "day": "Mon".."Sun", "completed": <int> }` — count submissions with `status IN ('submitted','evaluated')` grouped by **local weekday** of `submitted_at` for the last 7 calendar days (timezone: server or configurable; document choice).
- **Monthly statistics:** Array `{ "month": "Jan", "assignments": <int> }` — count assignments **due** in each of the last 6 months or current academic window.
- **Upcoming assignments:** Top 3 by `due_date ASC` where `due_date >= today` (student’s assignments), each with `id`, `title`, `course_code`, `due_date`, `display_status`.
- **Recent submissions:** Top 3 submitted, sorted by `submitted_at DESC`, fields `title`, `course_code`, `submitted_on` (date string).

### 5.2 `GET /api/staff/dashboard`

**Purpose:** Match `FacultyDashboard.tsx`.

**Aggregates:**

- **Cards:** `assignments_created` (count staff’s assignments), `total_students` (distinct students in staff’s courses/batches), `submissions_count`, `completion_rate` (submitted+evaluated / eligible assignments × students, or simplified % matching UI intent).
- **Pie `completion_data`:** Counts of student-assignment pairs: Completed (submitted/evaluated), Pending (not due), Incomplete (past due, not submitted).
- **Course progress:** Per course staff teaches: `{ "course", "submissions", "total_students" }`.
- **Recent assignments table:** Assignments with `students` (eligible count), `submitted` (count submitted), `due_date`.

### 5.3 Admin dashboard

There is **no** admin dashboard aggregation API or admin dashboard page in the current app; admins land on **Student Data** (`/admin/student-data`).

---

## 6. Assignment Workflow APIs (lifecycle)

### 6.1 State machine

```
                    ┌─────────┐
                    │ (none)  │ no submission row yet
                    └────┬────┘
                         │ first save draft or auto-create row
                         ▼
                    ┌─────────┐
         ┌─────────│  draft  │──────────────┐
         │         └────┬────┘              │
         │              │ submit            │ delete draft (optional)
         │              ▼                   │
         │         ┌───────────┐            │
         │         │ submitted │            │
         │         └─────┬─────┘            │
         │               │ staff evaluates  │
         │               ▼                  │
         │         ┌────────────┐           │
         └────────►│ evaluated  │◄─────────┘
                   └────────────┘   (marks/feedback update)
```

**Rules:**

- **Draft:** `content` optional; `submitted_at` null; student can PATCH via draft endpoint.
- **Submit:** Idempotent for same content; set `status = submitted`, `submitted_at = now()`, clear draft server-side; **optional policy:** allow late submit after `due_date` (UI shows warning but allows submit).
- **Evaluate:** Only Staff owner of assignment (or Admin); **recommended rule (matches UI):** `current_date >= assignment.due_date` (calendar date). Set `status = evaluated`, `marks`, `feedback`, `evaluated_at`.
- **Resubmit:** Not supported in current UI after submit; API may return `409` if attempted.

### 6.2 Endpoints (student)

- **`POST /api/student/assignments/:id/draft`** — Body: `{ "content": "<string>" }`. Upsert submission row; `status` remains `draft` unless already submitted/evaluated (then `409`).
- **`POST /api/student/assignments/:id/submit`** — Body: `{ "content": "<string>" }`. Requires non-empty trimmed content. Sets `submitted`. Triggers notifications to course staff.

### 6.3 Endpoints (staff)

- **`POST /api/staff/assignments`** — Create assignment; body aligns with `GiveAssignment.tsx`: `title`, `description`, `course_id` (integer FK), `due_date` (ISO date `YYYY-MM-DD`). Validate `due_date` is **today or future** (UI uses date input min = today).
- **`PUT /api/staff/assignments/:id`** — Partial update same fields; cannot change `course_id` if submissions exist (recommend `409`).
- **`DELETE /api/staff/assignments/:id`** — Cascade deletes submissions per DDL or soft-delete policy (document).

---

## 7. Notification APIs

**Model (API):** Align with `NotificationsContext.tsx` but server stores persistent data.

| Field | Type | Notes |
|-------|------|--------|
| `id` | int | |
| `type` | string | e.g. `assignment`, `reminder`, `evaluation`, `submission`, `system` |
| `title` | string | |
| `message` | string | |
| `icon_key` | string | `bell` \| `alert` \| `check` \| `info` |
| `is_read` | boolean | maps to UI `unread` inverted |
| `created_at` | ISO8601 | Client may render relative time |

**Endpoints:**

- **`GET /api/notifications`** — Query: `?unread_only=true|false`. Response `{ "items": [...] }`.
- **`PATCH /api/notifications/:id/read`** — Body `{}`. Sets `is_read = true`. `404` if not owner.
- **`PATCH /api/notifications/read-all`** — Marks all for user read.
- **`DELETE /api/notifications/:id`** — Owner only (UI “dismiss”).
- **`DELETE /api/notifications`** — Clear all for user.

**Server-side triggers (recommended):** New assignment posted to batch/course → notify students; submission received → notify staff; evaluation completed → notify student.

---

## 8. Auth APIs

### 8.1 `POST /api/auth/login`

**Body:** `{ "email", "password" }`. **Do not** trust client-sent role; role comes from DB.

**Response `200`:** `{ "user", "access_token", "refresh_token", "expires_in" }`. **401** with a generic invalid-credentials message if no match (try env admin, then student row, then faculty row).

### 8.2 `POST /api/auth/refresh`

**Body:** `{ "refresh_token": "..." }` or refresh HttpOnly cookie.

**Response `200`:** New access token (and rotated refresh if implemented).

### 8.3 `POST /api/auth/logout`

Revoke current refresh token / session. Idempotent `204`.

### 8.4 `GET /api/auth/me`

**Response `200`:**

```json
{
  "id": 1,
  "name": "string",
  "email": "string",
  "role": "Student | Staff | Admin",
  "batch_id": 1,
  "batch_label": "2023"
}
```

Shape matches extending current `User` in `AuthContext.tsx` when integrated.

### 8.5 `PATCH /api/auth/me`

**Body (partial):** `{ "name"? }` — display name only for regular users; env-configured admins cannot change profile via this endpoint.

### 8.6 `PUT /api/auth/password`

**Body:** `{ "current_password": "...", "new_password": "..." }`. Validates current hash; min length 6.

---

## 9. Error Handling Standards

- Use **JSON** error body consistently:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable summary",
    "details": [{ "field": "email", "issue": "already_exists" }]
  }
}
```

| HTTP | `code` | When |
|------|--------|------|
| 400 | `BAD_REQUEST` | Malformed JSON or parameters |
| 401 | `UNAUTHORIZED` | Missing/invalid access token |
| 403 | `FORBIDDEN` | Valid auth but wrong role or ownership |
| 404 | `NOT_FOUND` | Resource id unknown |
| 409 | `CONFLICT` | Duplicate email, illegal state transition |
| 422 | `VALIDATION_ERROR` | Field validation (password length, marks range) |
| 429 | `RATE_LIMITED` | Throttle login |
| 500 | `INTERNAL_ERROR` | Unhandled (log server-side; generic message to client) |

---

## 10. Response Standards

- **Success:** `2xx` with JSON body; `204` for deletes where no body.
- **Pagination (optional):** `{ "items": [], "total": 100, "limit": 20, "offset": 0 }`.
- **Dates:** Prefer ISO8601 for timestamps (`created_at`, `submitted_at`); **assignment due dates** as `YYYY-MM-DD` to match UI.
- **Naming:** JSON keys `snake_case` (Python/Flask convention) or `camelCase` if team aligns with existing TS — **pick one** project-wide; this doc uses `snake_case` for backend-first alignment.
- **CORS:** Allow frontend origin, credentials if cookies used.
- **Health:** `GET /api/health` → `{ "status": "ok" }` for load balancers.

---

## 11. Security Requirements

- **Passwords:** Argon2id or bcrypt with per-user salt; never log passwords.
- **JWT:** Access short TTL (e.g. 15m); refresh long TTL with rotation and reuse detection; include `sub`, `role`, `exp`, `iat`, optional `jti`.
- **HTTPS** in production; secure cookie flags if using cookies.
- **Input limits:** Max body size for assignment `content` (e.g. 512KB–2MB configurable).
- **SQL injection:** Parameterized queries only (SQLAlchemy/psycopg).
- **Authorization:** Central decorator/middleware checking role + resource ownership on every route.
- **Rate limiting:** Login endpoint.
- **Admin actions:** Auditable (`audit_log` recommended).

---

## 12. Flask Project Structure (recommended)

```
backend/
  app/
    __init__.py          # create_app(), extensions
    config.py            # Dev/Prod, DATABASE_URL, JWT secrets
    models/              # SQLAlchemy models matching DDL
    schemas/             # Marshmallow / Pydantic request-response
    routes/
      auth.py
      student.py
      staff.py
      admin.py
      notifications.py
    services/            # dashboards, notifications, submission rules
    middleware/
      auth.py            # JWT decode, role check
    errors.py            # attach_error_handlers()
  migrations/            # Alembic
  tests/
  wsgi.py
requirements.txt
```

**Libraries (typical):** Flask, Flask-JWT-Extended or PyJWT, SQLAlchemy, Alembic, psycopg2-binary, marshmallow, python-dotenv, gunicorn.

**Frontend integration (no UI redesign):** When replacing mocks, wire `AuthContext.tsx` to `/api/auth/*`; lists/dashboards to student/staff/admin endpoints; `AssignmentWork.tsx` to draft/submit; `NotificationsContext.tsx` to notification routes; `GiveAssignment.tsx` to staff course list; admin modals to admin CRUD. Edit icons in admin tables have no full edit flow yet — add `PATCH` routes when product extends those modals.

---

*Document generated from TracSig frontend source and planning spec. Version: 1.0 — March 2026.*
