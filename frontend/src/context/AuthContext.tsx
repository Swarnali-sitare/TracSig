import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import * as authService from '../services/authService';
import type { User, UserRole, LoginCredentials, SignupCredentials } from '../types';

interface AuthContextValue {
  user: User | null;
  role: UserRole | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  setTokensAndUser: (accessToken: string, user: User) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const role = user?.role ?? null;

  const setTokensAndUser = useCallback((token: string, u: User) => {
    setAccessToken(token);
    setUser(u);
  }, []);

  const clearAuth = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const { accessToken: token, user: u } = await authService.login(credentials);
    setTokensAndUser(token, u);
  }, [setTokensAndUser]);

  const signup = useCallback(async (credentials: SignupCredentials) => {
    await authService.signup(credentials);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  const refreshToken = useCallback(async () => {
    const { accessToken: token, user: u } = await authService.refresh();
    setTokensAndUser(token, u);
  }, [setTokensAndUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role,
      accessToken,
      isAuthenticated: accessToken != null && accessToken !== '',
      login,
      signup,
      logout,
      refreshToken,
      setTokensAndUser,
      clearAuth,
    }),
    [user, role, accessToken, login, signup, logout, refreshToken, setTokensAndUser, clearAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx == null) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
