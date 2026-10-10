import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getProjects, createProject, updateProject, deleteProject } from '../services/projectService';
import { getAllTasks } from '../services/taskService';
import useDebounce from '../hooks/useDebounce';
import ProjectModal from '../components/projects/ProjectModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import { formatDate, statusLabel } from '../utils/formatters';
import './Projects.css';

const Projects = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [projects, setProjects] = useState([]);
  const [taskCounts, setTaskCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [status, setStatus] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const params = {};
      if (status) params.status = status;
      const [projRes, taskRes] = await Promise.all([getProjects(params), getAllTasks()]);
      const list = projRes.data?.data || [];
      const allTasks = taskRes.data?.data || [];
      const counts = {};
      list.forEach((p) => {
        const mine = allTasks.filter((t) => (t.project?._id || t.project) === p._id);
        counts[p._id] = { total: mine.length, done: mine.filter((t) => t.status === 'done').length };
      });
      setProjects(list);
      setTaskCounts(counts);
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Could not load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [status]);

  // Fetch-on-mount: stable callback, runs once. No render cascade.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const visible = projects.filter((p) =>
    !debouncedSearch ||
    p.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const handleSubmit = async (payload) => {
    setBusy(true);
    try {
      if (editing) {
        await updateProject(editing._id, payload);
        success('Project updated.');
      } else {
        await createProject(payload);
        success('Project created.');
      }
      setModalOpen(false);
      setEditing(null);
      load();
    } catch (err) {
      error(err.response?.data?.message || 'Could not save project.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteProject(deleting._id);
      success('Project and its tasks deleted.');
      setDeleting(null);
      load();
    } catch (err) {
      error(err.response?.data?.message || 'Could not delete project.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Workspace</div>
          <h1>Projects</h1>
          <div className="sub">{loading ? 'Loading…' : `${visible.length} project${visible.length === 1 ? '' : 's'}`}</div>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus size={16} aria-hidden="true" /> New project
          </button>
        </div>
      </div>

      <div className="filter-bar panel">
        <div className="search-box">
          <Search size={16} aria-hidden="true" />
          <input type="search" aria-label="Search projects" placeholder="Search projects…" value={search} onChange={(e) => setSearch(e.target.value)} />
          {search && (
            <button type="button" className="icon-btn" onClick={() => setSearch('')} aria-label="Clear search">
              <X size={15} />
            </button>
          )}
        </div>
        <div className="filter-row">
          <label>Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="loader-row"><span className="spinner" aria-hidden="true" /><span>Loading projects…</span></div>
      ) : loadError ? (
        <div className="error-box" role="alert">
          <p style={{ margin: '0 0 12px' }}>{loadError}</p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={load}>Retry</button>
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          title="No projects found"
          hint="Create a project to group related tasks, track progress, and hit deadlines."
          action={<button type="button" className="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={16} aria-hidden="true" /> New project</button>}
        />
      ) : (
        <div className="project-grid">
          {visible.map((p) => {
            const c = taskCounts[p._id] || { total: 0, done: 0 };
            const pct = c.total === 0 ? 0 : Math.round((c.done / c.total) * 100);
            return (
              <article key={p._id} className="project-card" style={{ borderTop: `3px solid ${p.color || '#355B45'}` }}>
                <div className="project-card-top">
                  <span className="muted small project-count">{c.done}/{c.total} tasks</span>
                  <span className={`badge badge-${p.status}`}>{statusLabel(p.status)}</span>
                </div>
                <button type="button" className="link-title project-title" onClick={() => navigate(`/projects/${p._id}`)}>
                  {p.title}
                </button>
                <p className="muted small project-desc">{p.description || 'No description.'}</p>
                <div className="progress-bar" aria-hidden="true">
                  <span className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="project-meta muted small">
                  <span>{pct}% complete</span>
                  <span>{p.dueDate ? `Due ${formatDate(p.dueDate)}` : 'No due date'}</span>
                </div>
                <div className="project-actions">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate(`/projects/${p._id}`)}>Open</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEditing(p); setModalOpen(true); }}>Edit</button>
                  <button type="button" className="btn btn-ghost btn-sm danger" onClick={() => setDeleting(p)}>Delete</button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <ProjectModal
          project={editing}
          busy={busy}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSubmit={handleSubmit}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete project"
          message={`Delete “${deleting.title}” and all of its tasks? This cannot be undone.`}
          busy={busy}
          onCancel={() => setDeleting(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
};

export default Projects;
