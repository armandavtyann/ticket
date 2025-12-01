import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth.types';
import { checkIdempotency } from '../utils/idempotency';
import Job from '../models/Job';
import JobItem from '../models/JobItem';

export const idempotencyMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const { type, payload } = req.body;
  const idempotencyKey = req.headers['idempotency-key'] as string || req.body.idempotencyKey;

  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const result = await checkIdempotency(req.user.id, type, payload, idempotencyKey);

  if (result.isDuplicate && result.existingJobId) {
    const existingJob = await Job.findByPk(result.existingJobId, {
      include: [
        {
          model: JobItem,
          as: 'items',
        },
      ],
    });

    if (existingJob) {
      return res.status(200).json({
        id: existingJob.id,
        type: existingJob.type,
        status: existingJob.status,
        progress: existingJob.progress,
        message: 'Job already exists',
      });
    }
  }

  (req as any).idempotencyKey = result.key;
  next();
};
