const EmptyState = ({ title, hint, action }) => (
  <div className="empty">
    <h3>{title}</h3>
    <p>{hint}</p>
    {action}
  </div>
);

export default EmptyState;
