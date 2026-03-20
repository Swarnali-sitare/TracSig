import React, { createContext, useContext, useState, useEffect } from "react";
import api from "@/lib/api";

export type UserRole = "student" | "staff" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  batch_id?: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role?: UserRole) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("tracsig_token");
    const storedUser = localStorage.getItem("tracsig_user");
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      // Verify token is still valid
      api.get("/auth/me")
        .then(({ data }) => {
          const u = data.data.user as User;
          setUser(u);
          localStorage.setItem("tracsig_user", JSON.stringify(u));
        })
        .catch(() => {
          localStorage.removeItem("tracsig_token");
          localStorage.removeItem("tracsig_user");
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string, _role?: UserRole) => {
    setIsLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      const { user: u, access_token } = data.data;
      localStorage.setItem("tracsig_token", access_token);
      localStorage.setItem("tracsig_user", JSON.stringify(u));
      setUser(u as User);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    setIsLoading(true);
    try {
      const { data } = await api.post("/auth/register", { name, email, password, role });
      const { user: u, access_token } = data.data;
      localStorage.setItem("tracsig_token", access_token);
      localStorage.setItem("tracsig_user", JSON.stringify(u));
      setUser(u as User);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore errors on logout
    }
    setUser(null);
    localStorage.removeItem("tracsig_token");
    localStorage.removeItem("tracsig_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
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
