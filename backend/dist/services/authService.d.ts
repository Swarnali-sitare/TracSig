import type { User, AuthTokens, SignupBody, LoginBody } from '../types';
export declare function signupUser(body: SignupBody): Promise<User>;
export interface LoginResult extends AuthTokens {
    refreshToken: string;
}
export declare function loginUser(body: LoginBody): Promise<LoginResult>;
export declare function getMe(userId: string): User | null;
export declare function refreshAccessToken(refreshToken: string): {
    accessToken: string;
    user: User;
};
//# sourceMappingURL=authService.d.ts.map