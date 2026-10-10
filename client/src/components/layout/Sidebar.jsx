import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, FolderKanban, CalendarDays, Settings, LogOut, Orbit } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const links = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/tasks', label: 'My Tasks', icon: CheckSquare },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/upcoming', label: 'Upcoming', icon: CalendarDays },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const Sidebar = ({ open, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    onClose?.();
    navigate('/login');
  };

  const initial = (user?.name || user?.email || '?').trim().charAt(0).toUpperCase();

  return (
    <>
      <div
        className={`sidebar-scrim${open ? ' visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`sidebar${open ? ' open' : ''}`} aria-label="Primary navigation">
        <div className="sidebar-brand">
          <span className="brand-mark" aria-hidden="true">
            <Orbit size={20} strokeWidth={2.2} />
          </span>
          <span className="brand-name">TaskOrbit</span>
        </div>

        <nav className="sidebar-nav">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <Icon size={18} strokeWidth={2} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="user-chip">
            <span className="avatar" aria-hidden="true">{initial}</span>
            <span className="user-meta">
              <span className="user-name">{user?.name || 'Member'}</span>
              <span className="user-email">{user?.email || ''}</span>
            </span>
          </div>
          <button type="button" className="btn btn-ghost logout-btn" onClick={handleLogout}>
            <LogOut size={16} aria-hidden="true" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
