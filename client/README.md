# TaskOrbit — Client

React 19 + Vite frontend for TaskOrbit. See the root `README.md` for full setup, API docs, and scripts.

## Quick start

```bash
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:5000/api
npm run dev            # http://localhost:5173
npm run build          # production bundle in dist/
```

## Structure

- `src/pages/` — Login, Register, Dashboard, Tasks, Projects, ProjectDetail, Upcoming, Settings
- `src/components/` — layout (Sidebar), tasks (TaskModal, TaskDetail), projects (ProjectModal), common (Modal, ConfirmDialog, Badges, EmptyState)
- `src/context/` — AuthContext (verified session), ToastContext
- `src/services/` — `api.js` axios instance + auth/project/task/dashboard modules
- `src/layouts/` — AppLayout shell, `src/routes/` — ProtectedRoute
