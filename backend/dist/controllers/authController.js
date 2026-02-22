"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.signup = signup;
exports.login = login;
exports.logout = logout;
exports.refresh = refresh;
exports.me = me;
const authService = __importStar(require("../services/authService"));
const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME ?? 'refreshToken';
const REFRESH_COOKIE_HTTP_ONLY = process.env.REFRESH_COOKIE_HTTP_ONLY !== 'false';
const REFRESH_COOKIE_SECURE = process.env.REFRESH_COOKIE_SECURE === 'true';
const REFRESH_COOKIE_SAME_SITE = process.env.REFRESH_COOKIE_SAME_SITE ?? 'lax';
const REFRESH_COOKIE_MAX_AGE_DAYS = parseInt(process.env.REFRESH_COOKIE_MAX_AGE_DAYS ?? '7', 10);
const COOKIE_MAX_AGE_MS = REFRESH_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
function setRefreshCookie(res, refreshToken) {
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
        httpOnly: REFRESH_COOKIE_HTTP_ONLY,
        secure: REFRESH_COOKIE_SECURE,
        sameSite: REFRESH_COOKIE_SAME_SITE,
        maxAge: COOKIE_MAX_AGE_MS,
        path: '/',
    });
}
function clearRefreshCookie(res) {
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/', httpOnly: true });
}
async function signup(req, res) {
    try {
        const body = req.body;
        const user = await authService.signupUser(body);
        res.status(201).json({ message: 'Signup successful', user });
    }
    catch (err) {
        const e = err;
        const status = e.statusCode ?? 500;
        res.status(status).json({ message: e.message ?? 'Signup failed' });
    }
}
async function login(req, res) {
    try {
        const body = req.body;
        const { accessToken, refreshToken, user } = await authService.loginUser(body);
        setRefreshCookie(res, refreshToken);
        res.status(200).json({ accessToken, user });
    }
    catch (err) {
        const e = err;
        const status = e.statusCode ?? 500;
        res.status(status).json({ message: e.message ?? 'Login failed' });
    }
}
async function logout(_req, res) {
    clearRefreshCookie(res);
    res.status(200).json({ message: 'Logged out' });
}
async function refresh(req, res) {
    try {
        const token = req.cookies?.[REFRESH_COOKIE_NAME];
        if (!token) {
            res.status(401).json({ message: 'Refresh token required' });
            return;
        }
        const { accessToken, user } = authService.refreshAccessToken(token);
        res.status(200).json({ accessToken, user });
    }
    catch (err) {
        const e = err;
        res.status(401).json({ message: e.message ?? 'Refresh failed' });
    }
}
async function me(req, res) {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const user = authService.getMe(req.user.userId);
    if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
    }
    res.status(200).json({ user });
}
//# sourceMappingURL=authController.js.map