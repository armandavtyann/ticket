import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { logger } from './utils/logger';
import apiRoutes from './routes/index';

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
}));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', apiRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.type === 'entity.too.large') {
    logger.error('Request payload too large', err, { path: req.path, limit: '10mb' });
    return res.status(413).json({ 
      error: 'Request payload too large',
      message: 'The request body exceeds the maximum allowed size of 10MB. Please reduce the number of items.',
    });
  }
  
  logger.error('Unhandled error', err, { path: req.path });
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
