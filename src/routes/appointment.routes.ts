import { Router } from 'express';
import { getAppointments, createAppointment, cancelAppointment } from '../controllers/appointment.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getAppointments);
router.post('/', createAppointment);
router.patch('/:id/cancel', cancelAppointment);

export default router;
