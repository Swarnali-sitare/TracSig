import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { fromBackendRole } from "../types/apiRoles";
import { clearStoredTokens, getStoredRefreshToken, setStoredTokens } from "../services/api";
import { fetchMe, loginRequest, logoutRequest, type AuthMe } from "../services/tracsigApi";

/** App / URL role. Backend returns Student | Staff | Admin — map with `fromBackendRole`. */
export type UserRole = "student" | "faculty" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string | null;
  batchId?: number | null;
  batchLabel?: string | null;
}

function meToUser(m: AuthMe): User {
  return {
    id: String(m.id),
    name: m.name,
    email: m.email,
    role: fromBackendRole(m.role),
    department: m.department,
    batchId: m.batch_id,
    batchLabel: m.batch_label,
  };
}

const USER_KEY = "tracsig_user";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  isLoading: boolean;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    const me = await fetchMe();
    const u = meToUser(me);
    setUser(u);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    return u;
  }, []);

  useEffect(() => {
    const run = async () => {
      const stored = localStorage.getItem(USER_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as User;
          const raw = parsed as unknown as { role: string };
          if (raw.role === "staff") {
            parsed.role = "faculty";
            localStorage.setItem(USER_KEY, JSON.stringify(parsed));
          }
          setUser(parsed);
        } catch {
          localStorage.removeItem(USER_KEY);
        }
      }
      const token = localStorage.getItem("tracsig_access_token");
      if (!token) {
        setUser(null);
        localStorage.removeItem(USER_KEY);
        setIsLoading(false);
        return;
      }
      try {
        await refreshUser();
      } catch {
        clearStoredTokens();
        setUser(null);
        localStorage.removeItem(USER_KEY);
      } finally {
        setIsLoading(false);
      }
    };
    void run();
  }, [refreshUser]);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const data = await loginRequest(email, password);
      setStoredTokens(data.access_token, data.refresh_token);
      const u = await refreshUser();
      if (!u) {
        throw new Error("Failed to load profile");
      }
      return u;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    const rt = getStoredRefreshToken();
    void logoutRequest(rt);
    clearStoredTokens();
    setUser(null);
    localStorage.removeItem(USER_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
