/**
 * In-memory user store for demo. Replace with DB (e.g. Prisma, TypeORM) in production.
 */
import { UserModel, UserRole } from '../types';
export declare function createUser(id: string, name: string, email: string, passwordHash: string, role: UserRole): UserModel;
export declare function findUserById(id: string): UserModel | undefined;
export declare function findUserByEmail(email: string): UserModel | undefined;
//# sourceMappingURL=User.d.ts.map