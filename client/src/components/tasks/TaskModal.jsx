import { useState } from 'react';
import Modal from '../common/Modal';
import { statusLabel, capitalize } from '../../utils/formatters';

const STATUSES = ['todo', 'in-progress', 'review', 'done'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const toInputDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

const TaskModal = ({ task, projects, defaultProjectId, onClose, onSubmit, busy }) => {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    project: task?.project?._id || task?.project || defaultProjectId || projects[0]?._id || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    dueDate: toInputDate(task?.dueDate),
  });
  const [errors, setErrors] = useState({});

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.title.trim() || form.title.trim().length < 2) {
      next.title = 'Title must be at least 2 characters.';
    }
    if (!form.project) next.project = 'Choose a project for this task.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      project: form.project,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate || null,
    });
  };

  return (
    <Modal title={isEdit ? 'Edit task' : 'New task'} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="task-title">Title <span className="req">*</span></label>
          <input id="task-title" value={form.title} onChange={set('title')} placeholder="e.g. Draft release notes" maxLength={200} autoFocus />
          {errors.title && <span className="err">{errors.title}</span>}
        </div>

        <div className="field">
          <label htmlFor="task-desc">Description</label>
          <textarea id="task-desc" value={form.description} onChange={set('description')} placeholder="What needs to be done?" />
        </div>

        <div className="form-grid">
          <div className="field">
            <label htmlFor="task-project">Project <span className="req">*</span></label>
            <select id="task-project" value={form.project} onChange={set('project')} disabled={isEdit}>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.title}</option>
              ))}
            </select>
            {errors.project && <span className="err">{errors.project}</span>}
          </div>
          <div className="field">
            <label htmlFor="task-due">Due date</label>
            <input id="task-due" type="date" value={form.dueDate} onChange={set('dueDate')} />
          </div>
          <div className="field">
            <label htmlFor="task-status">Status</label>
            <select id="task-status" value={form.status} onChange={set('status')}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{statusLabel(s)}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="task-priority">Priority</label>
            <select id="task-priority" value={form.priority} onChange={set('priority')}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{capitalize(p)}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TaskModal;
