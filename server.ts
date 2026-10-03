import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import chatsRouter from './src/server/routes/chats.ts';
import evaluationRouter from './src/server/routes/evaluation.ts';
import learningRouter from './src/server/routes/learning.ts';
import mediaRouter from './src/server/routes/media.ts';
import settingsRouter from './src/server/routes/settings.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Body parsing with 50mb limit for media/datasets
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'LinguaLens AI Backend',
    version: '1.0.0',
    capabilities: ['language_detection', 'code_switching', 'robustness_evaluation', 'learning_engine', 'voice_synthesis'],
  });
});

// API Routes
app.use('/api/chats', chatsRouter);
app.use('/api/messages', chatsRouter);
app.use('/api/evaluation', evaluationRouter);
app.use('/api/learning', learningRouter);
app.use('/api/media', mediaRouter);
app.use('/api/voice', mediaRouter); // Alias voice routes under /api/voice
app.use('/api/settings', settingsRouter);

// Standard JSON error handler (never leaks raw stack traces)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred while processing the linguistic request.',
    },
  });
});

async function startServer() {
  if (!isProd) {
    // Vite Dev Server Middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LinguaLens Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
