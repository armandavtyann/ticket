import { Worker, Job } from 'bullmq';
import redis from '../config/redis';
import { logger } from '../utils/logger';
import { ticketService } from '../services/ticketService';
import { jobService } from '../services/jobService';

const worker = new Worker(
  'bulk-delete',
  async (job: Job) => {
    const { jobId, ticketIds, userId } = job.data;
    
    logger.info('Processing bulk delete job', { 
      module: 'WorkerModule', 
      jobId, 
      ticketCount: ticketIds.length 
    });

    try {
      await jobService.updateStatus(jobId, 'running', 0);

      await publishJobEvent(userId, 'jobs:progress', {
        jobId,
        status: 'running',
        progress: 0,
        succeeded: 0,
        failed: 0,
      });
      
      logger.info('Job started, processing tickets', { 
        module: 'WorkerModule', 
        jobId, 
        total: ticketIds.length 
      });

      const total = ticketIds.length;
      let succeeded = 0;
      let failed = 0;

      let lastProgressPercent = -1;
      let lastUpdateTime = Date.now();
      const minUpdateInterval = 100;
      
      for (let i = 0; i < ticketIds.length; i++) {
        const ticketId = ticketIds[i];
        
        const cancelFlag = await redis.get(`cancel:${jobId}`);
        if (cancelFlag === '1') {
          logger.info('Job cancelled', { module: 'WorkerModule', jobId });
          await jobService.updateStatus(jobId, 'canceled');
          await publishJobEvent(userId, 'jobs:canceled', {
            jobId,
            status: 'canceled',
          });
          return { cancelled: true };
        }

        try {
          await ticketService.softDelete(ticketId);
          await jobService.createJobItem(jobId, ticketId, true);
          succeeded++;
        } catch (error: any) {
          failed++;
          logger.error('Failed to delete ticket', error, { 
            module: 'WorkerModule', 
            jobId, 
            ticketId 
          });
          await jobService.createJobItem(jobId, ticketId, false, error.message);
        }

        const currentProgressPercent = ((i + 1) / total) * 100;
        const currentTime = Date.now();
        const timeSinceLastUpdate = currentTime - lastUpdateTime;
        const roundedProgress = Math.round(currentProgressPercent);
        
        const progressDelta = roundedProgress - lastProgressPercent;
        const shouldUpdate = progressDelta >= 1 || 
                           timeSinceLastUpdate >= minUpdateInterval ||
                           i === ticketIds.length - 1;

        if (shouldUpdate) {
          await jobService.updateStatus(jobId, 'running', roundedProgress);

          await publishJobEvent(userId, 'jobs:progress', {
            jobId,
            status: 'running',
            progress: roundedProgress,
            succeeded,
            failed,
          });

          await job.updateProgress(roundedProgress);
          
          lastProgressPercent = roundedProgress;
          lastUpdateTime = currentTime;
          
          if (timeSinceLastUpdate < 50) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
      }

      const finalStatus = failed === 0 ? 'completed' : 'succeeded';
      await jobService.updateStatus(jobId, finalStatus, 100);

      await publishJobEvent(userId, 'jobs:completed', {
        jobId,
        status: finalStatus,
        progress: 100,
        succeeded,
        failed,
        total,
      });

      logger.info('Bulk delete job completed', { 
        module: 'WorkerModule', 
        jobId, 
        succeeded, 
        failed 
      });

      return {
        succeeded,
        failed,
        total,
      };
    } catch (error: any) {
      logger.error('Bulk delete job failed', error, { 
        module: 'WorkerModule', 
        jobId 
      });

      await jobService.updateStatus(jobId, 'failed');
      
      await publishJobEvent(userId, 'jobs:failed', {
        jobId,
        status: 'failed',
        error: error.message,
      });

      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 1,
    removeOnComplete: {
      count: 100,
      age: 24 * 3600,
    },
    removeOnFail: {
      count: 1000,
    },
  }
);

async function publishJobEvent(userId: string, event: string, data: any) {
  try {
    const eventData = {
      event,
      userId,
      data,
    };
    await redis.publish('job:events', JSON.stringify(eventData));
    logger.debug('Job event published', {
      module: 'WorkerModule',
      event,
      userId,
      jobId: data?.jobId,
    });
  } catch (error) {
    logger.error('Failed to publish job event', error as Error, {
      module: 'WorkerModule'
    });
  }
}

worker.on('completed', (job) => {
  logger.info('Job completed', { 
    module: 'WorkerModule', 
    jobId: job.id 
  });
});

worker.on('failed', (job, err) => {
  logger.error('Job failed', err, { 
    module: 'WorkerModule', 
    jobId: job?.id 
  });
});

worker.on('error', (err) => {
  logger.error('Worker error', err, { module: 'WorkerModule' });
});

logger.info('Bulk delete worker started', { module: 'WorkerModule' });

export default worker;

