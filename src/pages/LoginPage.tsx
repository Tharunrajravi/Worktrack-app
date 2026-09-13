import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

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
    <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="panel-raised" style={{ width: 380, padding: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <span
            aria-hidden
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: 'var(--brand)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-ink)',
              fontSize: 15,
              fontWeight: 800,
            }}
          >
            W
          </span>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>WorkTrack</div>
            <div style={{ color: 'var(--text-faint)', fontSize: 12 }}>Work &amp; skill management</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="login-name" className="field-label">
            Name
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
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 16 }}>
            Continue
          </button>
        </form>

        <div style={{ color: 'var(--text-faint)', fontSize: 12, marginTop: 20, lineHeight: 1.6 }}>
          Local development sign-in — Amazon Cognito replaces this in Phase 3.
        </div>
      </div>
    </div>
  );
}
