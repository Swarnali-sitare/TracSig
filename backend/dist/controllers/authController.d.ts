import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
export declare function signup(req: AuthRequest, res: Response): Promise<void>;
export declare function login(req: AuthRequest, res: Response): Promise<void>;
export declare function logout(_req: AuthRequest, res: Response): Promise<void>;
export declare function refresh(req: AuthRequest, res: Response): Promise<void>;
export declare function me(req: AuthRequest, res: Response): Promise<void>;
//# sourceMappingURL=authController.d.ts.map