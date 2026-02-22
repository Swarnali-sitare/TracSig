"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const accessSecret = process.env.JWT_ACCESS_SECRET ?? 'access-secret-placeholder';
const refreshSecret = process.env.JWT_REFRESH_SECRET ?? 'refresh-secret-placeholder';
const accessExpirySeconds = 15 * 60; // 15m
const refreshExpirySeconds = 7 * 24 * 60 * 60; // 7d
function signAccessToken(payload) {
    return jsonwebtoken_1.default.sign({ ...payload, type: 'access' }, accessSecret, { expiresIn: accessExpirySeconds });
}
function signRefreshToken(payload) {
    return jsonwebtoken_1.default.sign({ ...payload, type: 'refresh' }, refreshSecret, { expiresIn: refreshExpirySeconds });
}
function verifyAccessToken(token) {
    const decoded = jsonwebtoken_1.default.verify(token, accessSecret);
    if (decoded.type !== 'access')
        throw new Error('Invalid token type');
    return decoded;
}
function verifyRefreshToken(token) {
    const decoded = jsonwebtoken_1.default.verify(token, refreshSecret);
    if (decoded.type !== 'refresh')
        throw new Error('Invalid token type');
    return decoded;
}
//# sourceMappingURL=jwt.js.map