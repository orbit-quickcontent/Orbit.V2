import { Router } from 'express';
import { validateBody } from '../middleware/validation';
import { loginHandler, loginSchema } from '../controllers/authController';

const router = Router();

router.post('/auth/login', validateBody(loginSchema), loginHandler);

export default router;
