import { Router } from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth';
import { 
  getDailyAgenda, 
  updateAppointmentStatus,
  getOverview,
  createService,
  updateService,
  deleteService,
  createBarber,
  updateBarber,
  deleteBarber
} from '../controllers/admin.controller';

const router = Router();

router.use(authenticateToken);
router.use(isAdmin);

router.get('/overview', getOverview);
router.get('/agenda', getDailyAgenda);
router.patch('/appointments/:id/status', updateAppointmentStatus);

// Services
router.post('/services', createService);
router.patch('/services/:id', updateService);
router.delete('/services/:id', deleteService);

// Barbers
router.post('/barbers', createBarber);
router.patch('/barbers/:id', updateBarber);
router.delete('/barbers/:id', deleteBarber);

export default router;
