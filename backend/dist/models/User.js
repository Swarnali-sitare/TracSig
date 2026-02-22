"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = createUser;
exports.findUserById = findUserById;
exports.findUserByEmail = findUserByEmail;
const users = new Map();
function createUser(id, name, email, passwordHash, role) {
    const user = {
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
function findUserById(id) {
    return users.get(id);
}
function findUserByEmail(email) {
    const normalized = email.toLowerCase();
    for (const u of users.values()) {
        if (u.email === normalized)
            return u;
    }
    return undefined;
}
//# sourceMappingURL=User.js.map