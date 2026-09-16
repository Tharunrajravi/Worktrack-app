import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { WorkTrackLogo } from './WorkTrackLogo';

export default function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="app-shell-header">
        <div className="app-shell-header-inner">
          <div className="app-shell-left">
            <NavLink to="/" className="app-shell-brand" aria-label="WorkTrack home">
              <WorkTrackLogo size="sm" />
            </NavLink>

            <nav className="app-shell-nav" aria-label="Primary">
              <NavTab to="/">Dashboard</NavTab>
              <NavTab to="/work-track">Work Track</NavTab>
            </nav>
          </div>

          <div className="app-shell-user">
            <span className="app-shell-user-status" aria-hidden="true" />
            <span className="app-nav-label">{user?.displayName}</span>
            <button onClick={logout} className="btn btn-secondary btn-sm">
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="app-shell-main">
        <Outlet />
      </main>
    </div>
  );
}

function NavTab({ to, children }: { to: string; children: string }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `nav-tab ${isActive ? 'nav-tab-active' : ''}`
      }
    >
      {children}
    </NavLink>
  );
}
