import { useState } from 'react';
import Modal from '../common/Modal';
import { StatusBadge, PriorityBadge, OverdueBadge } from '../common/Badges';
import { formatDate, formatDateTime, isOverdue } from '../../utils/formatters';

const TaskDetail = ({ task, onClose, onEdit, onDelete }) => {
  const [confirming, setConfirming] = useState(false);
  const overdue = task.status !== 'done' && isOverdue(task.dueDate);
  const projectTitle = task.project?.title || '—';

  return (
    <Modal title={task.title} onClose={onClose}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <StatusBadge value={task.status} />
        <PriorityBadge value={task.priority} />
        {overdue && <OverdueBadge />}
      </div>

      <dl className="detail-list">
        <div><dt>Project</dt><dd>{projectTitle}</dd></div>
        <div><dt>Due date</dt><dd>{task.dueDate ? formatDate(task.dueDate) : 'No due date'}</dd></div>
        <div><dt>Created</dt><dd>{formatDateTime(task.createdAt)}</dd></div>
        <div><dt>Updated</dt><dd>{formatDateTime(task.updatedAt)}</dd></div>
      </dl>

      {task.description ? (
        <p style={{ whiteSpace: 'pre-wrap', margin: '0 0 18px' }}>{task.description}</p>
      ) : (
        <p className="muted" style={{ margin: '0 0 18px' }}>No description yet.</p>
      )}

      {!confirming ? (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-danger" onClick={() => setConfirming(true)}>
            Delete
          </button>
          <button type="button" className="btn btn-secondary" onClick={onEdit}>
            Edit
          </button>
        </div>
      ) : (
        <div className="form-error" style={{ marginBottom: 0 }}>
          <p style={{ margin: '0 0 12px' }}>Delete this task permanently?</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfirming(false)}>
              Keep task
            </button>
            <button type="button" className="btn btn-danger btn-sm" onClick={onDelete}>
              Yes, delete
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default TaskDetail;
