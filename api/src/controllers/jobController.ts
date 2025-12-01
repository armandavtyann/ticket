import { Request, Response } from 'express';
import { jobService } from '../services/jobService';
import { bulkDeleteQueue } from '../config/queue';
import { storeIdempotencyKey } from '../utils/idempotency';
import { emitJobEvent } from '../sockets/socketHandler';
import redis from '../config/redis';
import { AuthRequest } from '../types/auth.types';

export const jobController = {
  create: async (req: AuthRequest, res: Response) => {
    try {
      const { type, payload } = req.body;
      const idempotencyKey = (req as any).idempotencyKey;

      if (!type || !payload){
        return res.status(400).json({ error: 'Type and payload are required' });
      }

      const job = await jobService.create({
        type,
        payload,
        userId: req.user!.id,
      });

      if (idempotencyKey) {
        await storeIdempotencyKey(idempotencyKey, job.id);
      }

      await bulkDeleteQueue.add('bulk-delete', {
        jobId: job.id,
        ticketIds: payload.ticketIds || [],
        userId: req.user!.id,
      }, {
        jobId: job.id,
      });

      emitJobEvent(req.user!.id, 'jobs:created', {
        jobId: job.id,
        type: job.type,
        status: job.status,
        progress: job.progress,
      });

      res.status(201).json({
        id: job.id,
        type: job.type,
        status: job.status,
        progress: job.progress,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const job = await jobService.findById(req.params.id);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      const jobData = job.toJSON() as any;
      const items = jobData.items || [];
      const total = items.length;
      const succeeded = items.filter((item: any) => item.success).length;
      const failed = total - succeeded;

      res.json({
        ...jobData,
        summary: {
          total,
          succeeded,
          failed,
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  getAll: async (req: AuthRequest, res: Response) => {
    try {
      const { type, status } = req.query;
      const filters: any = { userId: req.user!.id };

      if (type) filters.type = type as string;
      if (status) filters.status = status as string;

      const jobs = await jobService.findAll(filters);
      res.json(jobs.map(job => job.toJSON()));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  cancel: async (req: AuthRequest, res: Response) => {
    try {
      const job = await jobService.cancelJob(req.params.id);

      await redis.setex(`cancel:${req.params.id}`, 3600, '1');

      emitJobEvent(req.user!.id, 'jobs:canceled', {
        jobId: job.id,
        status: job.status,
      });

      res.json({
        id: job.id,
        status: job.status,
        message: 'Job cancellation requested',
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
};
