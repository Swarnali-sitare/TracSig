"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signupUser = signupUser;
exports.loginUser = loginUser;
exports.getMe = getMe;
exports.refreshAccessToken = refreshAccessToken;
const bcrypt_1 = __importDefault(require("bcrypt"));
const User_1 = require("../models/User");
const jwt_1 = require("../utils/jwt");
const id_1 = require("../utils/id");
const VALID_ROLES = ['Teacher', 'Student', 'Admin'];
function validateSignupBody(body) {
    if (!body.name?.trim())
        throw Object.assign(new Error('Name is required'), { statusCode: 400 });
    if (!body.email?.trim())
        throw Object.assign(new Error('Email is required'), { statusCode: 400 });
    if (!body.password)
        throw Object.assign(new Error('Password is required'), { statusCode: 400 });
    if (body.password.length < 6)
        throw Object.assign(new Error('Password must be at least 6 characters'), { statusCode: 400 });
    if (!VALID_ROLES.includes(body.role))
        throw Object.assign(new Error('Invalid role'), { statusCode: 400 });
}
const SALT_ROUNDS = 10;
function toUser(model) {
    return {
        id: model.id,
        name: model.name,
        email: model.email,
        role: model.role,
        createdAt: model.createdAt,
    };
}
async function signupUser(body) {
    validateSignupBody(body);
    const existing = (0, User_1.findUserByEmail)(body.email);
    if (existing) {
        const error = new Error('Email already registered');
        error.statusCode = 409;
        throw error;
    }
    const passwordHash = await bcrypt_1.default.hash(body.password, SALT_ROUNDS);
    const id = (0, id_1.generateId)();
    const user = (0, User_1.createUser)(id, body.name, body.email, passwordHash, body.role);
    return toUser(user);
}
async function loginUser(body) {
    const user = (0, User_1.findUserByEmail)(body.email);
    if (!user) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }
    const valid = await bcrypt_1.default.compare(body.password, user.passwordHash);
    if (!valid) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }
    const accessToken = (0, jwt_1.signAccessToken)({
        userId: user.id,
        email: user.email,
        role: user.role,
    });
    const refreshToken = (0, jwt_1.signRefreshToken)({
        userId: user.id,
        email: user.email,
        role: user.role,
    });
    return {
        accessToken,
        refreshToken,
        user: toUser(user),
    };
}
function getMe(userId) {
    const user = (0, User_1.findUserById)(userId);
    return user ? toUser(user) : null;
}
function refreshAccessToken(refreshToken) {
    const payload = (0, jwt_1.verifyRefreshToken)(refreshToken);
    const user = (0, User_1.findUserById)(payload.userId);
    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 401;
        throw error;
    }
    const accessToken = (0, jwt_1.signAccessToken)({
        userId: user.id,
        email: user.email,
        role: user.role,
    });
    return { accessToken, user: toUser(user) };
}
//# sourceMappingURL=authService.js.map