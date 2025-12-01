import { Router } from 'express';
import ticketRoutes from './tickets';
import jobRoutes from './jobs';

const router = Router();

// Mount all routes
router.use('/tickets', ticketRoutes);
router.use('/jobs', jobRoutes);

export default router;
