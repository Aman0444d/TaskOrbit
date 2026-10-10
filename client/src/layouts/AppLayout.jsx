import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import './AppLayout.css';

const AppLayout = () => {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="app-main">
        <header className="app-topbar">
          <button
            type="button"
            className="icon-btn menu-btn"
            onClick={() => setNavOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            aria-expanded={navOpen}
          >
            <Menu size={20} />
          </button>
          <span className="topbar-label">TaskOrbit workspace</span>
        </header>
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
