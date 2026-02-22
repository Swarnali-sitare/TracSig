export type UserRole = 'Teacher' | 'Student' | 'Admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface SignupResponse {
  message: string;
  user: User;
}

export interface RefreshResponse {
  accessToken: string;
  user: User;
}
