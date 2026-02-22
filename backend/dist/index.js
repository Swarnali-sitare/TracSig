"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const app = (0, express_1.default)();
const port = parseInt(process.env.PORT ?? '4000', 10);
const basePath = process.env.API_BASE_PATH ?? '/api';
const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
app.use((0, cors_1.default)({
    origin: corsOrigin,
    credentials: true,
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use(`${basePath}/auth`, authRoutes_1.default);
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
app.listen(port);
//# sourceMappingURL=index.js.map