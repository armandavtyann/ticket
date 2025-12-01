import { Queue } from 'bullmq';
import redis from './redis';
import { logger } from '../utils/logger';

export const bulkDeleteQueue = new Queue('bulk-delete', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

logger.info('BullMQ queue initialized', { module: 'QueueModule', queueName: 'bulk-delete' });

export default bulkDeleteQueue;

