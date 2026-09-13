// ARCHITECTURE NOTE: this is a TEMPORARY mock auth mechanism for local
// development (Phase 1). It exists so the UI can be built before Cognito
// is wired up in Phase 3.
//
// To keep the eventual Cognito swap painless, every consumer of auth in
// this app goes through the `useAuth()` hook below and only touches
// `user`, `login`, `logout`, and `isAuthenticated` — never localStorage or
// any mock-specific detail directly. When Cognito replaces this file's
// internals (Amplify/Cognito SDK calls instead of localStorage), the hook's
// shape and every calling component should stay unchanged.
//
// The mock also does NOT hand out or rely on a "user id" that the backend
// would trust — it stores only a display name, mirroring the eventual rule
// that user identity for authorization always comes from a verified token,
// never from client-supplied data.

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface AuthUser {
  displayName: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (displayName: string) => void;
  logout: () => void;
}

const AUTH_KEY = 'worktrack_mock_auth_v1';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        localStorage.removeItem(AUTH_KEY);
      }
    }
  }, []);

  const login = (displayName: string) => {
    const nextUser: AuthUser = { displayName: displayName.trim() };
    localStorage.setItem(AUTH_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
