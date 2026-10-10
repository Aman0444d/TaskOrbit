import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { getAllTasks, updateTask } from '../services/taskService';
import EmptyState from '../components/common/EmptyState';
import { StatusBadge, PriorityBadge, OverdueBadge } from '../components/common/Badges';
import { formatDate, isOverdue } from '../utils/formatters';

const ScheduleSection = ({ title, hint, items, showOverdue, onMarkDone }) => (
  <section className="panel" aria-label={title} style={{ marginBottom: 16 }}>
    <div className="section-title"><h2>{title}</h2><span className="muted small">{items.length}</span></div>
    {items.length === 0 ? (
      <p className="muted small" style={{ margin: 0 }}>{hint}</p>
    ) : (
      <ul className="deadline-list">
        {items.map((t) => (
          <li key={t._id} className="deadline-item">
            <span>
              <span className="row-title">{t.title}</span>
              <span className="row-sub" style={{ display: 'block' }}>
                {t.project?.title || ''} · due {formatDate(t.dueDate)}
              </span>
            </span>
            <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {showOverdue ? <OverdueBadge /> : <StatusBadge value={t.status} />}
              <PriorityBadge value={t.priority} />
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => onMarkDone(t)}>Mark done</button>
            </span>
          </li>
        ))}
      </ul>
    )}
  </section>
);

const Upcoming = () => {
  const navigate = useNavigate();
  const { error } = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await getAllTasks({ sortBy: 'dueDate', order: 'asc' });
      setTasks(res.data?.data || []);
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Could not load upcoming tasks.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch-on-mount: stable callback, runs once. No render cascade.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const markDone = async (task) => {
    try {
      await updateTask(task._id, { status: 'done' });
      setTasks((prev) => prev.map((t) => (t._id === task._id ? { ...t, status: 'done' } : t)));
    } catch (err) {
      error(err.response?.data?.message || 'Could not update task.');
    }
  };

  const open = tasks.filter((t) => t.status !== 'done' && t.dueDate);
  const overdue = open.filter((t) => isOverdue(t.dueDate)).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  const next7 = open.filter((t) => {
    const d = new Date(t.dueDate);
    const now = new Date();
    const in7 = new Date();
    in7.setDate(now.getDate() + 7);
    return d >= new Date(new Date().setHours(0, 0, 0, 0)) && d <= in7;
  }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  const later = open.filter((t) => {
    const in7 = new Date();
    in7.setDate(new Date().getDate() + 7);
    return new Date(t.dueDate) > in7;
  }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Schedule</div>
          <h1>Upcoming</h1>
          <div className="sub">Overdue work first, then the next seven days, then everything later.</div>
        </div>
      </div>

      {loading ? (
        <div className="loader-row"><span className="spinner" aria-hidden="true" /><span>Loading schedule…</span></div>
      ) : loadError ? (
        <div className="error-box" role="alert">
          <p style={{ margin: '0 0 12px' }}>{loadError}</p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={load}>Retry</button>
        </div>
      ) : open.length === 0 ? (
        <EmptyState
          title="Nothing on the schedule"
          hint="Give tasks due dates and they will line up here automatically."
          action={<button type="button" className="btn btn-primary" onClick={() => navigate('/tasks')}>Open My Tasks</button>}
        />
      ) : (
        <>
          <ScheduleSection title="Overdue" hint="No overdue work. Nice." items={overdue} showOverdue onMarkDone={markDone} />
          <ScheduleSection title="Next 7 days" hint="Nothing due in the next week." items={next7} onMarkDone={markDone} />
          <ScheduleSection title="Later" hint="Nothing scheduled beyond next week." items={later} onMarkDone={markDone} />
        </>
      )}
    </div>
  );
};

export default Upcoming;
