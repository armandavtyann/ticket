import crypto from 'crypto';
import redis from '../config/redis';
import { IdempotencyResult } from '../types/idempotency.types';

/**
 * Generate idempotency key from request data
 * Sorts ticket IDs to ensure consistent key generation (matches frontend implementation)
 */
export function generateIdempotencyKey(userId: string, type: string, payload: any): string {
  // Sort ticket IDs to ensure consistent key generation (matches frontend)
  const sortedPayload = {
    ...payload,
    ticketIds: payload.ticketIds ? [...payload.ticketIds].sort() : payload.ticketIds,
  };
  const payloadString = JSON.stringify(sortedPayload);
  const hash = crypto.createHash('sha256').update(`${userId}:${type}:${payloadString}`).digest('hex');
  return hash;
}

/**
 * Check if request is idempotent and return existing job if found
 */
export async function checkIdempotency(
  userId: string,
  type: string,
  payload: any,
  providedKey?: string
): Promise<IdempotencyResult> {
  const key = providedKey || generateIdempotencyKey(userId, type, payload);
  const redisKey = `idempotency:${key}`;
  
  const existingJobId = await redis.get(redisKey);
  
  if (existingJobId) {
    return {
      isDuplicate: true,
      existingJobId,
      key,
    };
  }
  
  return {
    isDuplicate: false,
    key,
  };
}

/**
 * Store idempotency key mapping
 */
export async function storeIdempotencyKey(key: string, jobId: string, ttl: number = 86400): Promise<void> {
  const redisKey = `idempotency:${key}`;
  await redis.setex(redisKey, ttl, jobId);
}
