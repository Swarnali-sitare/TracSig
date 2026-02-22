export type UserRole = 'Teacher' | 'Student' | 'Admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

export interface UserModel extends User {
  passwordHash: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  type: 'access' | 'refresh';
}

export interface AuthTokens {
  accessToken: string;
  user: User;
}

export interface SignupBody {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginBody {
  email: string;
  password: string;
}
