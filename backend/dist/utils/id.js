"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = generateId;
function generateId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}
//# sourceMappingURL=id.js.map