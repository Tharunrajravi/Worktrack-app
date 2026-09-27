import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import WorkTrackLogo from '../components/WorkTrackLogo';

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Enter a name to continue.');
      return;
    }
    login(trimmed);
    navigate('/', { replace: true });
  };

  return (
    <div className="wt-login">
      <div className="panel-raised wt-login-card">
        <div className="wt-login-hero">
          <WorkTrackLogo size={42} showWordmark />
        </div>

        <form onSubmit={handleSubmit} noValidate className="wt-login-form">
          <label htmlFor="login-name" className="field-label">
            Your name
          </label>
          <input
            id="login-name"
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="e.g. Tharunraj"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'login-name-error' : undefined}
            className={`input ${error ? 'input-invalid' : ''}`}
          />
          {error && (
            <div id="login-name-error" className="field-error" role="alert">
              {error}
            </div>
          )}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 18 }}>
            Start tracking
          </button>
        </form>

        <div className="wt-login-note">
          Local development sign-in — Amazon Cognito replaces this in Phase 3.
        </div>
      </div>
    </div>
  );
}
