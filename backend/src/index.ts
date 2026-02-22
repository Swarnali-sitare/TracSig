import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes';

const app = express();
const port = parseInt(process.env.PORT ?? '4000', 10);
const basePath = process.env.API_BASE_PATH ?? '/api';
const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

app.use(`${basePath}/auth`, authRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port);
