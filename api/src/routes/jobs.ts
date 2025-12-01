import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { idempotencyMiddleware } from '../middleware/idempotency';
import { jobController } from '../controllers/jobController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create job (requires admin for bulk-delete)
router.post(
  '/',
  requireAdmin,
  idempotencyMiddleware,
  jobController.create
);

router.get('/:id', jobController.getById);
router.get('/', jobController.getAll);
router.post('/:id/cancel', jobController.cancel);

export default router;
