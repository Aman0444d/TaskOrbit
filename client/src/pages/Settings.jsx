import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/formatters';

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initial = (user?.name || user?.email || '?').trim().charAt(0).toUpperCase();

  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <div className="page-head">
        <div>
          <div className="eyebrow">Account</div>
          <h1>Settings & profile</h1>
          <div className="sub">Your signed-in identity and session.</div>
        </div>
      </div>

      <section className="panel" aria-label="Profile">
        <div className="section-title"><h2>Profile</h2></div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
          <span className="avatar" style={{ width: 52, height: 52, fontSize: 22 }} aria-hidden="true">{initial}</span>
          <div>
            <div style={{ fontWeight: 750, fontSize: 17 }}>{user?.name || 'Member'}</div>
            <div className="muted small">{user?.email || ''}</div>
          </div>
        </div>
        <dl className="detail-list">
          <div><dt>User ID</dt><dd className="small" style={{ wordBreak: 'break-all' }}>{user?._id || '—'}</dd></div>
          <div><dt>Member since</dt><dd>{formatDateTime(user?.createdAt)}</dd></div>
        </dl>
        <p className="muted small" style={{ margin: '12px 0 0' }}>
          Profile editing is not available in this version — what you see is what the API securely returns for the signed-in user.
        </p>
      </section>

      <section className="panel" aria-label="Session" style={{ marginTop: 16 }}>
        <div className="section-title"><h2>Session</h2></div>
        <p className="muted small" style={{ margin: '0 0 14px' }}>
          Signing out clears your token on this device. Your projects and tasks stay saved.
        </p>
        <button type="button" className="btn btn-danger" onClick={handleLogout}>
          <LogOut size={16} aria-hidden="true" /> Log out
        </button>
      </section>
    </div>
  );
};

export default Settings;
