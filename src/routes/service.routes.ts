import { Router } from 'express';
import { getServices, createService } from '../controllers/service.controller';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = Router();

router.get('/', getServices);
router.post('/', authenticateToken, isAdmin, createService);

export default router;
