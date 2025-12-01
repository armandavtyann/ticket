import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { ticketController } from '../controllers/ticketController';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', ticketController.getAll);
router.get('/:id', ticketController.getById);
router.post('/', ticketController.create);
router.put('/:id', ticketController.update);
router.delete('/:id', ticketController.delete);

export default router;
