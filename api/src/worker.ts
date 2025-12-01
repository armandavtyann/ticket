import dotenv from 'dotenv';
import { logger } from './utils/logger';
import './workers/bulkDeleteWorker';

dotenv.config();

const NODE_ENV = process.env.NODE_ENV;

logger.info('Starting Support Ticket Manager Worker', {
  module: 'WorkerBootstrap',
  env: NODE_ENV,
  nodeVersion: process.version,
});

process.on('SIGTERM', () => {
  logger.info('Worker received SIGTERM, shutting down gracefully', {
    module: 'WorkerBootstrap',
  });
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Worker received SIGINT, shutting down gracefully', {
    module: 'WorkerBootstrap',
  });
  process.exit(0);
});
