import { useState } from 'react';
import Modal from '../common/Modal';

const SWATCHES = ['#355B45', '#667C82', '#B77A32', '#477455', '#7A6A53', '#8A5A44', '#4A5D6B'];

const toInputDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

const ProjectModal = ({ project, onClose, onSubmit, busy }) => {
  const isEdit = !!project;
  const [form, setForm] = useState({
    title: project?.title || '',
    description: project?.description || '',
    status: project?.status || 'active',
    color: project?.color || SWATCHES[0],
    dueDate: toInputDate(project?.dueDate),
  });
  const [errors, setErrors] = useState({});

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = {};
    if (!form.title.trim() || form.title.trim().length < 2) {
      next.title = 'Title must be at least 2 characters.';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      color: form.color,
      dueDate: form.dueDate || null,
    });
  };

  return (
    <Modal title={isEdit ? 'Edit project' : 'New project'} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="proj-title">Title <span className="req">*</span></label>
          <input id="proj-title" value={form.title} onChange={set('title')} placeholder="e.g. Website redesign" maxLength={200} autoFocus />
          {errors.title && <span className="err">{errors.title}</span>}
        </div>

        <div className="field">
          <label htmlFor="proj-desc">Description</label>
          <textarea id="proj-desc" value={form.description} onChange={set('description')} placeholder="What is this project about?" />
        </div>

        <div className="form-grid">
          <div className="field">
            <label htmlFor="proj-status">Status</label>
            <select id="proj-status" value={form.status} onChange={set('status')}>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="proj-due">Due date</label>
            <input id="proj-due" type="date" value={form.dueDate} onChange={set('dueDate')} />
          </div>
        </div>

        <div className="field">
          <label>Accent color</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm((f) => ({ ...f, color: c }))}
                aria-label={`Choose color ${c}`}
                aria-pressed={form.color === c}
                style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: c, cursor: 'pointer',
                  border: form.color === c ? '3px solid #202720' : '2px solid #DDDCD2',
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create project'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProjectModal;
