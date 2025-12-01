import Redis from 'ioredis';
import { logger } from '../utils/logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

redis.on('error', (err) => {
  logger.error('Redis connection error', err, { module: 'RedisModule' });
});

redis.on('connect', () => {
  logger.info('Redis connected', { module: 'RedisModule', url: REDIS_URL });
});

redis.on('ready', () => {
  logger.info('Redis ready', { module: 'RedisModule' });
});

export default redis;

