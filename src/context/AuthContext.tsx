import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch, setApiCsrfToken } from '../lib/api';
import type { AdminUser, SessionStatusResponse } from '../types/cms';

interface AuthContextValue {
  loading: boolean;
  authenticated: boolean;
  authorised: boolean;
  admin: AdminUser | null;
  system: SessionStatusResponse['system'];
  checkSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateAdminLocal: (admin: AdminUser) => void;
}

const DEFAULT_SYSTEM: SessionStatusResponse['system'] = {
  mongoConfigured: false,
  dbConnected: false,
  cloudinaryConfigured: false,
  hasAdminAccount: false,
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState<boolean>(true);
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [authorised, setAuthorised] = useState<boolean>(false);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [system, setSystem] = useState<SessionStatusResponse['system']>(DEFAULT_SYSTEM);

  const checkSession = useCallback(async () => {
    try {
      const res = await apiFetch<SessionStatusResponse>('/api/auth/session');
      setAuthenticated(res.authenticated);
      setAuthorised(res.authorised);
      setAdmin(res.admin);
      setSystem(res.system || DEFAULT_SYSTEM);
      setApiCsrfToken(res.csrfToken);
    } catch {
      setAuthenticated(false);
      setAuthorised(false);
      setAdmin(null);
      setApiCsrfToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  const login = async (email: string, password: string) => {
    const res = await apiFetch<{
      authenticated: boolean;
      authorised: boolean;
      admin: AdminUser;
      csrfToken: string;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setAuthenticated(res.authenticated);
    setAuthorised(res.authorised);
    setAdmin(res.admin);
    setApiCsrfToken(res.csrfToken);
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setAuthenticated(false);
      setAuthorised(false);
      setAdmin(null);
      setApiCsrfToken(null);
    }
  };

  const updateAdminLocal = (updated: AdminUser) => {
    setAdmin(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        loading,
        authenticated,
        authorised,
        admin,
        system,
        checkSession,
        login,
        logout,
        updateAdminLocal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
