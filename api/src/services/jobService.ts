import { Op } from 'sequelize';
import Job from '../models/Job';
import JobItem from '../models/JobItem';
import Ticket from '../models/Ticket';
import { logger } from '../utils/logger';
import { CreateJobData, JobFilters } from '../types/job.types';

export const jobService = {
  async create(data: CreateJobData) {
    const job = await Job.create({
      type: data.type,
      status: 'queued',
      progress: 0,
      payload: data.payload,
      userId: data.userId,
    });

    logger.info('Job created', { jobId: job.id, type: job.type, userId: data.userId });
    return job;
  },

  async findById(id: string) {
    return Job.findByPk(id, {
      include: [
        {
          model: JobItem,
          as: 'items',
          include: [
            {
              model: Ticket,
              as: 'ticket',
            },
          ],
        },
      ],
    });
  },

  async updateStatus(id: string, status: string, progress?: number) {
    const job = await Job.findByPk(id);
    if (!job) {
      throw new Error('Job not found');
    }

    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (progress !== undefined) {
      updateData.progress = progress;
    }

    return job.update(updateData);
  },

  async findAll(filters?: JobFilters) {
    const where: any = {};

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    return Job.findAll({
      where,
      include: [
        {
          model: JobItem,
          as: 'items',
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 100,
    });
  },

  async createJobItem(jobId: string, ticketId: string, success: boolean, error?: string) {
    return JobItem.create({
      jobId,
      ticketId,
      success,
      error: error || null,
    });
  },

  async cancelJob(id: string) {
    const job = await Job.findByPk(id);

    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status === 'completed' || job.status === 'failed') {
      throw new Error('Cannot cancel a completed or failed job');
    }

    return job.update({
      status: 'canceled',
      updatedAt: new Date(),
    });
  },
};

