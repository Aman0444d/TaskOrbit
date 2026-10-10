import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderPlus, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getDashboardStats } from '../services/dashboardService';
import { getProjects, createProject } from '../services/projectService';
import { getAllTasks, updateTask } from '../services/taskService';
import { createProjectTask } from '../services/projectService';
import TaskModal from '../components/tasks/TaskModal';
import ProjectModal from '../components/projects/ProjectModal';
import EmptyState from '../components/common/EmptyState';
import { StatusBadge, PriorityBadge, OverdueBadge } from '../components/common/Badges';
import { formatDate, greetingFor, isOverdue } from '../utils/formatters';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [dashRes, projRes, taskRes] = await Promise.all([
        getDashboardStats(),
        getProjects(),
        getAllTasks({ sortBy: 'dueDate', order: 'asc' }),
      ]);
      setStats(dashRes.data?.data || null);
      setProjects(projRes.data?.data || []);
      setTasks(taskRes.data?.data || []);
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Could not load your workspace. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch-on-mount: stable callback, runs once. No render cascade.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const handleCreateTask = async (payload) => {
    setBusy(true);
    try {
      await createProjectTask(payload.project, payload);
      success('Task created.');
      setTaskModalOpen(false);
      load();
    } catch (err) {
      error(err.response?.data?.message || 'Could not create task.');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateProject = async (payload) => {
    setBusy(true);
    try {
      await createProject(payload);
      success('Project created.');
      setProjectModalOpen(false);
      load();
    } catch (err) {
      error(err.response?.data?.message || 'Could not create project.');
    } finally {
      setBusy(false);
    }
  };

  const quickStatus = async (task, status) => {
    try {
      await updateTask(task._id, { status });
      setTasks((prev) => prev.map((t) => (t._id === task._id ? { ...t, status } : t)));
      load();
    } catch (err) {
      error(err.response?.data?.message || 'Could not update task.');
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loader-row"><span className="spinner" aria-hidden="true" /><span>Loading your workspace…</span></div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="page">
        <div className="error-box" role="alert">
          <p style={{ margin: '0 0 12px' }}>{loadError}</p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={load}>Retry</button>
        </div>
      </div>
    );
  }

  const t = stats?.tasks || { total: 0, todo: 0, inProgress: 0, done: 0, overdue: 0 };
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const metrics = [
    { label: 'Total tasks', value: t.total, to: '/tasks', tone: '' },
    { label: 'To do', value: t.todo, to: '/tasks?status=todo', tone: '' },
    { label: 'In progress', value: t.inProgress, to: '/tasks?status=in-progress', tone: '' },
    { label: 'Completed', value: t.done, to: '/tasks?status=done', tone: '' },
    { label: 'Overdue', value: t.overdue, to: '/tasks?overdue=1', tone: 'stat-overdue' },
  ];

  const progressByProject = projects.slice(0, 5).map((p) => {
    const mine = tasks.filter((x) => (x.project?._id || x.project) === p._id);
    const done = mine.filter((x) => x.status === 'done').length;
    const pct = mine.length === 0 ? 0 : Math.round((done / mine.length) * 100);
    return { ...p, taskCount: mine.length, doneCount: done, pct };
  });

  const upcoming = [...tasks]
    .filter((x) => x.status !== 'done' && x.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  const priorityList = [...tasks]
    .filter((x) => x.status !== 'done')
    .sort((a, b) => {
      const rank = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (rank[a.priority] ?? 9) - (rank[b.priority] ?? 9);
    })
    .slice(0, 6);

  const firstName = (user?.name || '').split(' ')[0] || 'there';

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">{today}</div>
          <h1>{greetingFor()}, {firstName}.</h1>
          <div className="sub">
            {t.total === 0
              ? 'Your workspace is ready — create a project and your first task to get going.'
              : `${t.total} task${t.total === 1 ? '' : 's'} on your plate${t.overdue > 0 ? `, ${t.overdue} overdue` : ''}.`}
          </div>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setProjectModalOpen(true)}>
            <FolderPlus size={16} aria-hidden="true" /> New project
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setTaskModalOpen(true)} disabled={projects.length === 0}>
            <Plus size={16} aria-hidden="true" /> New task
          </button>
        </div>
      </div>

      {t.total === 0 && projects.length === 0 ? (
        <EmptyState
          title="Set up your first project"
          hint="Projects group related tasks. Create one, then add tasks with due dates and priorities."
          action={
            <button type="button" className="btn btn-primary" onClick={() => setProjectModalOpen(true)}>
              <FolderPlus size={16} aria-hidden="true" /> Create project
            </button>
          }
        />
      ) : (
        <>
          <div className="stat-strip" role="group" aria-label="Task statistics">
            {metrics.map((m) => (
              <button
                key={m.label}
                type="button"
                className={`stat ${m.tone}`.trim()}
                onClick={() => navigate(m.to)}
                aria-label={`${m.label}: ${m.value}. View filtered tasks.`}
              >
                <span className="stat-value" aria-hidden="true">{m.value}</span>
                <span className="stat-label" aria-hidden="true">{m.label}</span>
              </button>
            ))}
          </div>

          <div className="dash-grid">
            <section className="panel" aria-label="Project progress">
              <div className="section-title">
                <h2>Project progress</h2>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}>
                  View all <ArrowRight size={14} aria-hidden="true" />
                </button>
              </div>
              {progressByProject.length === 0 ? (
                <p className="muted small">No projects yet.</p>
              ) : (
                <ul className="progress-list">
                  {progressByProject.map((p) => (
                    <li key={p._id}>
                      <button type="button" className="progress-row" onClick={() => navigate(`/projects/${p._id}`)}>
                        <span className="progress-meta">
                          <span className="progress-name">
                            <span className="swatch" style={{ background: p.color }} aria-hidden="true" />
                            {p.title}
                          </span>
                          <span className="muted small progress-pct">{p.doneCount}/{p.taskCount} done</span>
                        </span>
                        <span className="progress-bar" aria-hidden="true">
                          <span className="progress-fill" style={{ width: `${p.pct}%` }} />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="panel" aria-label="Upcoming deadlines">
              <div className="section-title">
                <h2>Upcoming deadlines</h2>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/upcoming')}>
                  View all <ArrowRight size={14} aria-hidden="true" />
                </button>
              </div>
              {upcoming.length === 0 ? (
                <p className="muted small">Nothing scheduled. Tasks with due dates will appear here.</p>
              ) : (
                <ul className="deadline-list">
                  {upcoming.map((x) => (
                    <li key={x._id}>
                      <button type="button" className="deadline-row" onClick={() => navigate(`/tasks?search=${encodeURIComponent(x.title)}`)}>
                        <span>
                          <span className="row-title">{x.title}</span>
                          <span className="row-sub">{x.project?.title || ''} · due {formatDate(x.dueDate)}</span>
                        </span>
                        {x.status !== 'done' && isOverdue(x.dueDate) ? <OverdueBadge /> : <PriorityBadge value={x.priority} />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="panel" aria-label="Priority tasks" style={{ marginTop: 20 }}>
            <div className="section-title">
              <h2>Needs your attention</h2>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/tasks')}>
                Open My Tasks <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
            {priorityList.length === 0 ? (
              <p className="muted small">All clear — no open tasks.</p>
            ) : (
              <div className="table-wrap stack-table">
                <table className="data">
                  <thead>
                    <tr><th>Task</th><th>Status</th><th>Priority</th><th>Due</th><th><span className="sr-only">Actions</span></th></tr>
                  </thead>
                  <tbody>
                    {priorityList.map((x) => (
                      <tr key={x._id}>
                        <td>
                          <span className="row-title">{x.title}</span>
                          <span className="row-sub" style={{ display: 'block' }}>{x.project?.title || ''}</span>
                        </td>
                        <td><StatusBadge value={x.status} /></td>
                        <td><PriorityBadge value={x.priority} /></td>
                        <td className="small">{x.dueDate ? formatDate(x.dueDate) : '—'}</td>
                        <td>
                          {x.status !== 'done' && (
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => quickStatus(x, 'done')}>
                              Mark done
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {taskModalOpen && (
        <TaskModal
          projects={projects}
          busy={busy}
          onClose={() => setTaskModalOpen(false)}
          onSubmit={handleCreateTask}
        />
      )}
      {projectModalOpen && (
        <ProjectModal busy={busy} onClose={() => setProjectModalOpen(false)} onSubmit={handleCreateProject} />
      )}
    </div>
  );
};

export default Dashboard;
