import { statusLabel } from '../../utils/formatters';

export const StatusBadge = ({ value }) => (
  <span className={`badge badge-${value}`}>
    <span className="dot" aria-hidden="true" />
    {statusLabel(value)}
  </span>
);

const priorityLabels = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };

export const PriorityBadge = ({ value }) => (
  <span className={`badge badge-${value}`}>{priorityLabels[value] || value}</span>
);

export const OverdueBadge = () => <span className="badge badge-overdue">Overdue</span>;
