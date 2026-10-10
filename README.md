# TaskOrbit 🚀

A full-stack **MERN** project and task management application built for an internship assignment.

## Features

- **Auth** — register, login, persistent session with JWT, protected routes, logout.
- **Overview dashboard** — greeting, live task metrics (total / to-do / in-progress / completed / overdue) that link to filtered task views, per-project progress bars, upcoming deadlines, and a priority task table with one-click "mark done".
- **My Tasks** — search, status / priority / project filters, overdue-only toggle, 6 sort orders, result counts, create / view / edit / advance-status / delete with confirmation.
- **Projects** — search, status filter, progress cards with task counts, project detail page with its tasks, cascade delete (project deletion removes its tasks, never orphans).
- **Upcoming** — overdue, next-7-days, and later groupings derived from real due dates.
- **Settings** — signed-in profile (from `GET /api/auth/me`) and working logout.
- **Design** — warm paper + ivory + forest-green editorial theme, responsive sidebar → mobile drawer, stacked cards on small screens, toasts, accessible dialogs, reduced-motion support.

## Tech Stack

| Layer    | Technology                                                    |
|----------|---------------------------------------------------------------|
| Frontend | React 19, Vite 8, React Router, Axios                         |
| Backend  | Node.js, Express 5, Mongoose 9                                |
| Database | MongoDB Atlas / In-Memory MongoDB (for automated tests)       |
| Auth     | JWT (jsonwebtoken) + bcryptjs                                 |
| Testing  | Jest 30, Supertest 7, mongodb-memory-server 11                |

---

## Project Structure

```
TaskOrbit/
├── client/                  # React + Vite frontend
│   └── src/
│       ├── assets/          # Static images & SVGs
│       ├── components/      # Reusable UI components
│       │   ├── common/      # Modal, ConfirmDialog, EmptyState, Badges
│       │   ├── layout/      # Sidebar (+ CSS)
│       │   ├── projects/    # ProjectModal
│       │   └── tasks/       # TaskModal, TaskDetail
│       ├── context/         # AuthContext (verified session), ToastContext
│       ├── hooks/           # useDebounce, useLocalStorage
│       ├── layouts/         # AppLayout (sidebar shell + mobile topbar)
│       ├── pages/           # Login, Register, Dashboard, Tasks, Projects,
│       │                    # ProjectDetail, Upcoming, Settings (+ CSS)
│       ├── routes/          # ProtectedRoute guard
│       ├── services/        # Axios API client + service modules
│       └── utils/           # formatters.js, helpers
└── server/                  # Express + Mongoose backend
    ├── config/              # db.js (MongoDB connection)
    ├── controllers/         # Route handler logic (Auth, Projects, Tasks, Dashboard)
    ├── middleware/          # Auth guard, centralized error & 404 handlers
    ├── models/              # Mongoose schemas (User, Project, Task)
    ├── routes/              # Express router definitions
    ├── tests/               # Automated API test suite (api.test.js)
    ├── utils/               # generateToken.js
    └── validators/          # Input validation middleware
```

---

## Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account (or local MongoDB)

### Backend setup

1. Navigate to the backend directory:
   ```bash
   cd server
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Fill in the required environment variables in `.env`:
   - `PORT` (e.g., `5000`)
   - `NODE_ENV` (`development` or `production`)
   - `MONGO_URI` (your MongoDB Atlas connection string)
   - `JWT_SECRET` (secure random string)
   - `JWT_EXPIRES_IN` (e.g., `7d`)
   - `CLIENT_ORIGIN` or `CLIENT_URL` (e.g., `http://localhost:5173`)

4. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend setup

1. Navigate to the frontend directory:
   ```bash
   cd client
   ```

2. Install dependencies (includes axios, react-router-dom, lucide-react):
   ```bash
   npm install
   ```

3. (Optional) copy the example env file and point it at your API:
   ```bash
   cp .env.example .env
   # VITE_API_URL=http://localhost:5000/api
   ```

4. Start the Vite development server (in a separate terminal from the backend):
   ```bash
   npm run dev
   ```

5. Production build:
   ```bash
   npm run build
   ```

---

## Automated API Testing

The backend includes a comprehensive, isolated automated test suite covering all endpoints, user isolation, ownership guards, and edge cases.

### Running tests

From the `server/` directory:

```bash
# Run all tests
npm test

# Run tests with detailed verbose output
npm run test:verbose
```

### Test Isolation & Safety
- **Zero Risk to Production/Development Data**: Tests run against an isolated in-memory MongoDB instance (`mongodb-memory-server`). No real production or development collections are ever touched, modified, or dropped.
- **Repeatable & Self-Contained**: Database state is wiped clean between individual test cases, ensuring complete test independence.
- **Optional Test Database**: If desired, specify `MONGO_URI_TEST` in `.env.test` to target a dedicated staging database instead.

---

## API Endpoints Reference

### Authentication (`/api/auth`)
| Method | Route               | Auth Required | Description                                    |
|--------|---------------------|---------------|------------------------------------------------|
| POST   | `/api/auth/register`| No            | Register new user (name, email, password)       |
| POST   | `/api/auth/login`   | No            | Authenticate user and receive JWT token        |
| GET    | `/api/auth/me`      | Yes (Bearer)  | Retrieve current authenticated user profile    |

### Projects (`/api/projects`)
| Method | Route                   | Auth Required | Description                                    |
|--------|-------------------------|---------------|------------------------------------------------|
| GET    | `/api/projects`         | Yes (Bearer)  | List user projects (filters: `status`, `search`, `sortBy`, `order`) |
| POST   | `/api/projects`         | Yes (Bearer)  | Create a project (title, description, color, dueDate) |
| GET    | `/api/projects/:id`     | Yes (Bearer)  | Get single project details by ID               |
| PUT    | `/api/projects/:id`     | Yes (Bearer)  | Update project (title, description, status, etc.) |
| DELETE | `/api/projects/:id`     | Yes (Bearer)  | Delete project and cascade-delete its tasks   |
| GET    | `/api/projects/:id/tasks`| Yes (Bearer) | List all tasks belonging to this project       |
| POST   | `/api/projects/:id/tasks`| Yes (Bearer) | Create a task directly within this project     |

### Tasks (`/api/tasks`)
| Method | Route               | Auth Required | Description                                    |
|--------|---------------------|---------------|------------------------------------------------|
| GET    | `/api/tasks`        | Yes (Bearer)  | List all user tasks (filters: `status`, `priority`, `search`, `sortBy`) |
| GET    | `/api/tasks/:id`    | Yes (Bearer)  | Get single task details with populated project |
| PUT    | `/api/tasks/:id`    | Yes (Bearer)  | Update task (status, priority, title, order)   |
| DELETE | `/api/tasks/:id`    | Yes (Bearer)  | Delete single task                             |

### Dashboard (`/api/dashboard`)
| Method | Route               | Auth Required | Description                                    |
|--------|---------------------|---------------|------------------------------------------------|
| GET    | `/api/dashboard`    | Yes (Bearer)  | Aggregated project and task statistics for user|

### System Health (`/api/health`)
| Method | Route               | Auth Required | Description                                    |
|--------|---------------------|---------------|------------------------------------------------|
| GET    | `/api/health`       | No            | Server health check and timestamp              |

---

## Security & Architectural Guarantees

1. **User Isolation**: All project and task operations are strictly scoped to `req.user._id`. Users cannot access, modify, or delete resources belonging to other users (returns 404 to avoid leaking resource existence).
2. **Mass-Assignment Protection**: Whitelists are enforced on both `Project` and `Task` controllers. Protected fields such as `owner` cannot be overwritten by client payloads.
3. **Query Sanitization**: `sortBy` and filter fields are strictly checked against allowed sets to prevent query/parameter injection.
4. **Cascade Deletion**: Deleting a project automatically removes all associated tasks, preventing orphan documents in the database.
5. **Credential Protection**: Passwords are encrypted using `bcryptjs` with salt rounds. Passwords and stack traces are excluded from production responses.

---

## Environment Variables

| Variable         | Purpose                                             | Default / Example    |
|------------------|-----------------------------------------------------|----------------------|
| `PORT`           | Express HTTP server port                            | `5000`               |
| `NODE_ENV`       | Runtime environment (`development`, `production`, `test`) | `development` |
| `MONGO_URI`      | MongoDB Atlas connection string                     | *(Required)*         |
| `JWT_SECRET`     | Secret key used to sign and verify JWT tokens       | *(Required)*         |
| `JWT_EXPIRES_IN` | Token validity duration                             | `7d`                 |
| `CLIENT_ORIGIN`  | Allowed CORS origin for frontend requests           | `http://localhost:5173` |

> ⚠️ Never commit `.env` or `.env.test` files to version control. Both are ignored in `.gitignore`.

---

## Running Everything (cheat sheet)

```bash
# Backend API (terminal 1)
cd server
npm install
cp .env.example .env   # then fill in MONGO_URI + JWT_SECRET
npm run dev            # http://localhost:5000

# Frontend (terminal 2)
cd client
npm install
npm run dev            # http://localhost:5173

# Backend tests (isolated in-memory MongoDB, safe to run anytime)
cd server
npm test

# Frontend production build
cd client
npm run build
```

---

## Known Limitations

- No pagination: task/project lists return the full user-scoped result set. Fine for personal-scale data; add pagination if collections grow large.
- No profile editing or password change: the API has no endpoint for it, so Settings is intentionally read-only plus logout.
- Task creation is scoped to a project (`POST /api/projects/:id/tasks`); there is no standalone `POST /api/tasks`.
- JWTs are stored in `localStorage` (existing architecture). Trade-off: simple and works across refreshes, but vulnerable to XSS — the app avoids `dangerouslySetInnerHTML` and renders only trusted API data to mitigate this.
- The default project `color` in the database schema is an indigo fallback (`#6366f1`); the UI always assigns warm palette colors on create.

---

## AI Assistance Disclosure

- **Antigravity** generated the initial project structure (folders, backend scaffolding, validators, test suite) before this session.
- **CodeZero** (this session) performed the audit and built the complete frontend product: design-token CSS system, API client + services, auth/session context with `/auth/me` verification, protected routing, all 8 pages (Login, Register, Dashboard, Tasks, Projects, ProjectDetail, Upcoming, Settings), shared components (Sidebar, AppLayout shell, TaskModal, TaskDetail, ProjectModal, Modal, ConfirmDialog, toasts), the `VITE_API_URL` setup, plus verification (58 backend tests, production build, live end-to-end API smoke test) and this README update. No backend routes or schemas were changed — the existing API was reused as-is.
- **CodeZero — Phase 2 refinement** (follow-up session): replaced the five generic metric cards with a ruled editorial stat strip, fixed clipped task-table actions (min-width + card breakpoint), fixed run-together deadline rows, humanized all raw enum labels via `statusLabel`/`capitalize`, gave project cards a color edge with task counts, added mobile stacking tables and collapsing form grids, extracted `ScheduleSection`, fixed lint errors, and performed real browser QA (desktop screenshots, 390px/542px iframe viewports, mobile drawer, console/network checks) plus a full UI smoke test (register → project → tasks → edit → status → search → delete → logout → reload).

---

## License

MIT
