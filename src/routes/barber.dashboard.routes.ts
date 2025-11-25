import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getMyAppointments, updateAppointmentStatus, setAvailability, getAvailability, deleteAvailability } from '../controllers/barber.dashboard.controller';

const router = Router();

router.use(authenticateToken);

// Middleware to ensure user is a BARBER
const isBarber = (req: any, res: any, next: any) => {
  if (req.user.role !== 'BARBER') {
    return res.status(403).json({ message: 'Access denied. Barbers only.' });
  }
  next();
};

router.use(isBarber);

router.get('/appointments', getMyAppointments);
router.patch('/appointments/:id/status', updateAppointmentStatus);

router.get('/availability', getAvailability);
router.post('/availability', setAvailability);
router.delete('/availability/:id', deleteAvailability);

export default router;
