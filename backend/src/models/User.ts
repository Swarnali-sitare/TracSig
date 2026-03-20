/**
 * In-memory user store for demo. Replace with DB (e.g. Prisma, TypeORM) in production.
 */
import { UserModel, UserRole } from '../types';

const users: Map<string, UserModel> = new Map();

export function createUser(
  id: string,
  name: string,
  email: string,
  passwordHash: string,
  role: UserRole
): UserModel {
  const user: UserModel = {
    id,
    name,
    email: email.toLowerCase(),
    passwordHash,
    role,
    createdAt: new Date(),
  };
  users.set(user.id, user);
  return user;
}

export function findUserById(id: string): UserModel | undefined {
  return users.get(id);
}

export function findUserByEmail(email: string): UserModel | undefined {
  const normalized = email.toLowerCase();
  for (const u of users.values()) {
    if (u.email === normalized) return u;
  }
  return undefined;
}
