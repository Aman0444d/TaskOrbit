import Modal from './Modal';

const ConfirmDialog = ({ title, message, confirmLabel = 'Delete', onConfirm, onCancel, busy }) => (
  <Modal title={title} onClose={onCancel}>
    <p className="muted" style={{ margin: '0 0 20px' }}>{message}</p>
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
      <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
        Cancel
      </button>
      <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={busy}>
        {busy ? 'Working…' : confirmLabel}
      </button>
    </div>
  </Modal>
);

export default ConfirmDialog;
