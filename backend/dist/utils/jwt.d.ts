import { JwtPayload } from '../types';
export declare function signAccessToken(payload: Omit<JwtPayload, 'type'>): string;
export declare function signRefreshToken(payload: Omit<JwtPayload, 'type'>): string;
export declare function verifyAccessToken(token: string): JwtPayload;
export declare function verifyRefreshToken(token: string): JwtPayload;
//# sourceMappingURL=jwt.d.ts.map