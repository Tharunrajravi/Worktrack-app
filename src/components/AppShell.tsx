import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import WorkTrackLogo from './WorkTrackLogo';

export default function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          borderBottom: '1px solid var(--border)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(21,27,39,.92)',
          backdropFilter: 'blur(14px)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <span className="wt-shell-brand" title="WorkTrack" aria-label="WorkTrack">
            <WorkTrackLogo size={42} showWordmark={false} />
          </span>
          <nav style={{ display: 'flex', gap: 2 }} aria-label="Primary">
            <NavTab to="/">Dashboard</NavTab>
            <NavTab to="/work-track">Work Track</NavTab>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span className="app-nav-label" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {user?.displayName}
          </span>
          <button onClick={logout} className="btn btn-secondary btn-sm">
            Log out
          </button>
        </div>
      </header>
      <main style={{ flex: 1, padding: '32px 24px', maxWidth: 1080, width: '100%', margin: '0 auto' }}>
        <Outlet />
      </main>
    </div>
  );
}

function NavTab({ to, children }: { to: string; children: string }) {
  return (
    <NavLink to={to} end className={({ isActive }) => `nav-tab ${isActive ? 'nav-tab-active' : ''}`}>
      {children}
    </NavLink>
  );
}
