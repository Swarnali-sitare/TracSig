"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jwt_1 = require("../utils/jwt");
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    if (!token) {
        res.status(401).json({ message: 'Access token required' });
        return;
    }
    try {
        const payload = (0, jwt_1.verifyAccessToken)(token);
        req.user = payload;
        next();
    }
    catch {
        res.status(401).json({ message: 'Invalid or expired access token' });
    }
}
//# sourceMappingURL=authMiddleware.js.map