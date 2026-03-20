import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router";

/** App / URL role. Backend API uses Teacher | Student | Admin — map with `toBackendRole` in `types/apiRoles.ts` when calling `/api/auth`. */
export type UserRole = "student" | "faculty" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
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
    // Check for stored user on mount
    const storedUser = localStorage.getItem("tracsig_user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser) as User;
      const raw = parsed as unknown as { role: string };
      if (raw.role === "staff") {
        parsed.role = "faculty";
        localStorage.setItem("tracsig_user", JSON.stringify(parsed));
      }
      setUser(parsed);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role?: UserRole) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock user - in real app this would come from API
    const mockUser: User = {
      id: "1",
      name: email.split("@")[0],
      email,
      role: role || "student",
    };

    setUser(mockUser);
    localStorage.setItem("tracsig_user", JSON.stringify(mockUser));
    setIsLoading(false);
  };

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      role,
    };

    setUser(newUser);
    localStorage.setItem("tracsig_user", JSON.stringify(newUser));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
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
