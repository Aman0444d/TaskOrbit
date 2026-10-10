import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getAllTasks, getTask, updateTask, deleteTask } from '../services/taskService';
import { getProjects, createProjectTask } from '../services/projectService';
import useDebounce from '../hooks/useDebounce';
import TaskModal from '../components/tasks/TaskModal';
import TaskDetail from '../components/tasks/TaskDetail';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import { StatusBadge, PriorityBadge, OverdueBadge } from '../components/common/Badges';
import { formatDate, isOverdue, statusLabel, capitalize } from '../utils/formatters';
import './Tasks.css';

const STATUSES = ['', 'todo', 'in-progress', 'review', 'done'];
const PRIORITIES = ['', 'low', 'medium', 'high', 'urgent'];
const SORTS = [
  { value: 'dueDate:asc', label: 'Due date (earliest)' },
  { value: 'dueDate:desc', label: 'Due date (latest)' },
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'priority:asc', label: 'Priority' },
  { value: 'title:asc', label: 'Title A–Z' },
];

const PRIORITY_RANK = { urgent: 0, high: 1, medium: 2, low: 3 };

const Tasks = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { success, error } = useToast();

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebounce(search, 400);
  const status = searchParams.get('status') || '';
  const priority = searchParams.get('priority') || '';
  const project = searchParams.get('project') || '';
  const overdueOnly = searchParams.get('overdue') === '1';
  const sort = searchParams.get('sort') || 'dueDate:asc';

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewingId, setViewingId] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const patchParams = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (!v) next.delete(k);
      else next.set(k, v);
    });
    setSearchParams(next, { replace: true });
  };

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const params = {};
      if (status) params.status = status;
      if (priority) params.priority = priority;
      const [sortBy, order] = sort.split(':');
      if (sortBy !== 'priority') {
        params.sortBy = sortBy;
        params.order = order;
      }
      const [taskRes, projRes] = await Promise.all([
        getAllTasks(params),
        getProjects(),
      ]);
      let list = taskRes.data?.data || [];
      if (project) list = list.filter((t) => (t.project?._id || t.project) === project);
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        list = list.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            (t.description || '').toLowerCase().includes(q)
        );
      }
      if (overdueOnly) {
        list = list.filter((t) => t.status !== 'done' && isOverdue(t.dueDate));
      }
      if (sortBy === 'priority') {
        list = [...list].sort((a, b) => (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9));
      }
      setTasks(list);
      setProjects(projRes.data?.data || []);
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Could not load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [status, priority, project, overdueOnly, sort, debouncedSearch]);

  // Fetch-on-mount: stable callback, runs once. No render cascade.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  useEffect(() => {
    if (!viewingId) return; // cleared synchronously by close handlers below
    let cancelled = false;
    getTask(viewingId)
      .then((res) => {
        if (!cancelled) setViewing(res.data?.data || null);
      })
      .catch(() => {
        if (cancelled) return;
        error('Could not load task details.');
        setViewingId(null);
        setViewing(null);
      });
    return () => {
      cancelled = true;
    };
  }, [viewingId, error]);

  const filtersActive = status || priority || project || overdueOnly || debouncedSearch;

  const clearFilters = () => {
    setSearch('');
    setSearchParams({}, { replace: true });
  };

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleSubmit = async (payload) => {
    setBusy(true);
    try {
      if (editing) {
        // 'project' is intentionally excluded: the API forbids moving tasks between projects.
        const { title, description, status: nextStatus, priority, dueDate } = payload;
        await updateTask(editing._id, { title, description, status: nextStatus, priority, dueDate });
        success('Task updated.');
      } else {
        await createProjectTask(payload.project, payload);
        success('Task created.');
      }
      setModalOpen(false);
      setEditing(null);
      load();
    } catch (err) {
      error(err.response?.data?.message || 'Could not save task.');
    } finally {
      setBusy(false);
    }
  };

  const cycleStatus = async (task) => {
    const order = ['todo', 'in-progress', 'review', 'done'];
    const next = order[(order.indexOf(task.status) + 1) % order.length];
    try {
      await updateTask(task._id, { status: next });
      success(`Moved to ${next}.`);
      load();
    } catch (err) {
      error(err.response?.data?.message || 'Could not update status.');
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteTask(deleting._id);
      success('Task deleted.');
      setDeleting(null);
      if (viewingId === deleting._id) {
        setViewingId(null);
        setViewing(null);
      }
      load();
    } catch (err) {
      error(err.response?.data?.message || 'Could not delete task.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Workspace</div>
          <h1>My Tasks</h1>
          <div className="sub">
            {loading ? 'Loading…' : `${tasks.length} task${tasks.length === 1 ? '' : 's'}${filtersActive ? ' matching filters' : ''}`}
          </div>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={openCreate} disabled={projects.length === 0}>
            <Plus size={16} aria-hidden="true" /> New task
          </button>
        </div>
      </div>

      <div className="filter-bar panel">
        <div className="search-box">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            aria-label="Search tasks"
            placeholder="Search title or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="icon-btn" onClick={() => setSearch('')} aria-label="Clear search">
              <X size={15} />
            </button>
          )}
        </div>
        <div className="filter-row">
          <label>Status
            <select value={status} onChange={(e) => patchParams({ status: e.target.value })}>
              <option value="">All</option>
              {STATUSES.filter(Boolean).map((s) => (
                <option key={s} value={s}>{statusLabel(s)}</option>
              ))}
            </select>
          </label>
          <label>Priority
            <select value={priority} onChange={(e) => patchParams({ priority: e.target.value })}>
              <option value="">All</option>
              {PRIORITIES.filter(Boolean).map((p) => (
                <option key={p} value={p}>{capitalize(p)}</option>
              ))}
            </select>
          </label>
          <label>Project
            <select value={project} onChange={(e) => patchParams({ project: e.target.value })}>
              <option value="">All</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.title}</option>
              ))}
            </select>
          </label>
          <label>Sort
            <select value={sort} onChange={(e) => patchParams({ sort: e.target.value })}>
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => patchParams({ overdue: e.target.checked ? '1' : '' })}
            />
            Overdue only
          </label>
          {filtersActive && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loader-row"><span className="spinner" aria-hidden="true" /><span>Loading tasks…</span></div>
      ) : loadError ? (
        <div className="error-box" role="alert">
          <p style={{ margin: '0 0 12px' }}>{loadError}</p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={load}>Retry</button>
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          title={filtersActive ? 'No tasks match these filters' : projects.length === 0 ? 'Create a project first' : 'No tasks yet'}
          hint={filtersActive ? 'Try widening the search or clearing a filter.' : projects.length === 0 ? 'Tasks live inside projects. Create a project to get started.' : 'Add your first task and give it a due date and priority.'}
          action={filtersActive
            ? <button type="button" className="btn btn-secondary" onClick={clearFilters}>Clear filters</button>
            : projects.length > 0
              ? <button type="button" className="btn btn-primary" onClick={openCreate}><Plus size={16} aria-hidden="true" /> New task</button>
              : undefined}
        />
      ) : (
        <>
          <div className="table-wrap task-table">
            <table className="data">
              <thead>
                <tr><th>Task</th><th>Status</th><th>Priority</th><th>Due</th><th><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <button type="button" className="link-title" onClick={() => setViewingId(t._id)}>
                        {t.title}
                      </button>
                      <span className="row-sub" style={{ display: 'block' }}>{t.project?.title || ''}</span>
                    </td>
                    <td>
                      <button type="button" className="badge-btn" onClick={() => cycleStatus(t)} title="Click to advance status">
                        <StatusBadge value={t.status} />
                      </button>
                    </td>
                    <td><PriorityBadge value={t.priority} /></td>
                    <td className="small">
                      {t.dueDate ? formatDate(t.dueDate) : '—'}
                      {t.status !== 'done' && isOverdue(t.dueDate) && (
                        <span style={{ marginLeft: 6 }}><OverdueBadge /></span>
                      )}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEditing(t); setModalOpen(true); }}>Edit</button>
                        <button type="button" className="btn btn-ghost btn-sm danger" onClick={() => setDeleting(t)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card-list">
            {tasks.map((t) => (
              <article key={t._id} className="task-card">
                <button type="button" className="link-title" onClick={() => setViewingId(t._id)}>
                  {t.title}
                </button>
                <div className="task-card-meta muted small">{t.project?.title || ''}{t.dueDate ? ` · due ${formatDate(t.dueDate)}` : ''}</div>
                <div className="task-card-badges">
                  <button type="button" className="badge-btn" onClick={() => cycleStatus(t)} title="Click to advance status">
                    <StatusBadge value={t.status} />
                  </button>
                  <PriorityBadge value={t.priority} />
                  {t.status !== 'done' && isOverdue(t.dueDate) && <OverdueBadge />}
                </div>
                <div className="row-actions">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setEditing(t); setModalOpen(true); }}>Edit</button>
                  <button type="button" className="btn btn-ghost btn-sm danger" onClick={() => setDeleting(t)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {modalOpen && (
        <TaskModal
          task={editing}
          projects={projects}
          defaultProjectId={project || undefined}
          busy={busy}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSubmit={handleSubmit}
        />
      )}
      {viewing && (
        <TaskDetail
          task={viewing}
          onClose={() => { setViewingId(null); setViewing(null); }}
          onEdit={() => { setEditing(viewing); setViewingId(null); setViewing(null); setModalOpen(true); }}
          onDelete={() => { setViewingId(null); setViewing(null); setDeleting(viewing); }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete task"
          message={`Delete “${deleting.title}” permanently? This cannot be undone.`}
          busy={busy}
          onCancel={() => setDeleting(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
};

export default Tasks;
