import { Response, NextFunction } from 'express';
import { UserRole } from '../types';
import { AuthRequest } from './authMiddleware';
export declare function roleMiddleware(...allowedRoles: UserRole[]): (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=roleMiddleware.d.ts.map