import { Router } from 'express';
import { getBarbers } from '../controllers/barber.controller';

const router = Router();

router.get('/', getBarbers);

export default router;
