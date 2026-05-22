import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import env from './config/env.js';
import routes from './routes/index.js';
import healthRoutes from './routes/health.routes.js';
import requestLogger from './middlewares/requestLogger.js';
import notFound from './middlewares/notFound.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  }),
);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(requestLogger);

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Smart Job Portal API',
    version: '1.0.0',
  });
});

app.use('/health', healthRoutes);
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
