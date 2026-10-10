import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getProject, updateProject, deleteProject, getProjectTasks, createProjectTask } from '../services/projectService';
import { updateTask, deleteTask } from '../services/taskService';
import TaskModal from '../components/tasks/TaskModal';
import TaskDetail from '../components/tasks/TaskDetail';
import ProjectModal from '../components/projects/ProjectModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import { StatusBadge, PriorityBadge, OverdueBadge } from '../components/common/Badges';
import { formatDate, formatDateTime, isOverdue, statusLabel } from '../utils/formatters';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [projRes, taskRes] = await Promise.all([getProject(id), getProjectTasks(id)]);
      setProject(projRes.data?.data || null);
      setTasks(taskRes.data?.data || []);
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Could not load project. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fetch-on-mount: stable callback, runs once. No render cascade.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const handleCreateTask = async (payload) => {
    setBusy(true);
    try {
      await createProjectTask(id, payload);
      success('Task created.');
      setTaskModalOpen(false);
      load();
    } catch (err) {
      error(err.response?.data?.message || 'Could not create task.');
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateTask = async (payload) => {
    // 'project' is intentionally excluded: the API forbids moving tasks between projects.
    const { title, description, status, priority, dueDate } = payload;
    setBusy(true);
    try {
      await updateTask(editingTask._id, { title, description, status, priority, dueDate });
      success('Task updated.');
      setTaskModalOpen(false);
      setEditingTask(null);
      load();
    } catch (err) {
      error(err.response?.data?.message || 'Could not update task.');
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateProject = async (payload) => {
    setBusy(true);
    try {
      const res = await updateProject(id, payload);
      setProject(res.data?.data || project);
      success('Project updated.');
      setProjectModalOpen(false);
    } catch (err) {
      error(err.response?.data?.message || 'Could not update project.');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteProject = async () => {
    setBusy(true);
    try {
      await deleteProject(id);
      success('Project and its tasks deleted.');
      navigate('/projects');
    } catch (err) {
      error(err.response?.data?.message || 'Could not delete project.');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!deletingTask) return;
    setBusy(true);
    try {
      await deleteTask(deletingTask._id);
      success('Task deleted.');
      setDeletingTask(null);
      setViewing(null);
      load();
    } catch (err) {
      error(err.response?.data?.message || 'Could not delete task.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loader-row"><span className="spinner" aria-hidden="true" /><span>Loading project…</span></div>
      </div>
    );
  }

  if (loadError || !project) {
    return (
      <div className="page">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}>
          <ArrowLeft size={15} aria-hidden="true" /> Back to projects
        </button>
        <div className="error-box" role="alert" style={{ marginTop: 16 }}>
          <p style={{ margin: '0 0 12px' }}>{loadError || 'Project not found.'}</p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={load}>Retry</button>
        </div>
      </div>
    );
  }

  const done = tasks.filter((t) => t.status === 'done').length;
  const pct = tasks.length === 0 ? 0 : Math.round((done / tasks.length) * 100);

  return (
    <div className="page">
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}>
        <ArrowLeft size={15} aria-hidden="true" /> Back to projects
      </button>

      <div className="page-head" style={{ marginTop: 12 }}>
        <div>
          <div className="eyebrow">
            <span className="swatch" style={{ background: project.color, display: 'inline-block', verticalAlign: 'baseline', marginRight: 8 }} aria-hidden="true" />
            Project · <span className={`badge badge-${project.status}`}>{statusLabel(project.status)}</span>
          </div>
          <h1>{project.title}</h1>
          <div className="sub">
            {project.description || 'No description.'} · Created {formatDateTime(project.createdAt)}
            {project.dueDate ? ` · Due ${formatDate(project.dueDate)}` : ''}
          </div>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setProjectModalOpen(true)}>Edit project</button>
          <button type="button" className="btn btn-primary" onClick={() => setTaskModalOpen(true)}>
            <Plus size={16} aria-hidden="true" /> New task
          </button>
        </div>
      </div>

      <section className="panel" aria-label="Completion progress" style={{ marginBottom: 16 }}>
        <div className="section-title"><h2>Progress</h2><span className="muted small">{done}/{tasks.length} tasks · {pct}%</span></div>
        <div className="progress-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Project completion">
          <span className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="button" className="btn btn-ghost btn-sm danger" onClick={() => setConfirmDeleteProject(true)}>
            Delete project and its tasks
          </button>
        </div>
      </section>

      <section className="panel" aria-label="Project tasks">
        <div className="section-title"><h2>Tasks</h2></div>
        {tasks.length === 0 ? (
          <EmptyState
            title="No tasks in this project yet"
            hint="Add the first actionable step to get this project moving."
            action={<button type="button" className="btn btn-primary" onClick={() => setTaskModalOpen(true)}><Plus size={16} aria-hidden="true" /> New task</button>}
          />
        ) : (
          <>
            <div className="table-wrap task-table">
              <table className="data">
                <thead><tr><th>Task</th><th>Status</th><th>Priority</th><th>Due</th><th><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  {tasks.map((t) => (
                    <tr key={t._id}>
                      <td>
                        <button type="button" className="link-title" onClick={() => setViewing(t)}>{t.title}</button>
                      </td>
                      <td><StatusBadge value={t.status} /></td>
                      <td><PriorityBadge value={t.priority} /></td>
                      <td className="small">
                        {t.dueDate ? formatDate(t.dueDate) : '—'}
                        {t.status !== 'done' && isOverdue(t.dueDate) && <span style={{ marginLeft: 6 }}><OverdueBadge /></span>}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEditingTask(t); setTaskModalOpen(true); }}>Edit</button>
                          <button type="button" className="btn btn-ghost btn-sm danger" onClick={() => setDeletingTask(t)}>Delete</button>
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
                  <button type="button" className="link-title" onClick={() => setViewing(t)}>{t.title}</button>
                  <div className="task-card-badges">
                    <StatusBadge value={t.status} />
                    <PriorityBadge value={t.priority} />
                    {t.status !== 'done' && isOverdue(t.dueDate) && <OverdueBadge />}
                  </div>
                  <div className="muted small">{t.dueDate ? `Due ${formatDate(t.dueDate)}` : 'No due date'}</div>
                  <div className="row-actions">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setEditingTask(t); setTaskModalOpen(true); }}>Edit</button>
                    <button type="button" className="btn btn-ghost btn-sm danger" onClick={() => setDeletingTask(t)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {taskModalOpen && (
        <TaskModal
          task={editingTask}
          projects={[project]}
          defaultProjectId={project._id}
          busy={busy}
          onClose={() => { setTaskModalOpen(false); setEditingTask(null); }}
          onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        />
      )}
      {projectModalOpen && (
        <ProjectModal project={project} busy={busy} onClose={() => setProjectModalOpen(false)} onSubmit={handleUpdateProject} />
      )}
      {confirmDeleteProject && (
        <ConfirmDialog
          title="Delete project"
          message={`Delete “${project.title}” and all ${tasks.length} of its tasks? This cannot be undone.`}
          busy={busy}
          onCancel={() => setConfirmDeleteProject(false)}
          onConfirm={handleDeleteProject}
        />
      )}
      {viewing && (
        <TaskDetail
          task={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => { setEditingTask(viewing); setViewing(null); setTaskModalOpen(true); }}
          onDelete={() => { setViewing(null); setDeletingTask(viewing); }}
        />
      )}
      {deletingTask && (
        <ConfirmDialog
          title="Delete task"
          message={`Delete “${deletingTask.title}” permanently? This cannot be undone.`}
          busy={busy}
          onCancel={() => setDeletingTask(null)}
          onConfirm={handleDeleteTask}
        />
      )}
    </div>
  );
};

export default ProjectDetail;
