import { Router } from 'express';
import { validateBody } from '../middleware/validation';
import {
  loginHandler,
  loginSchema,
  googleAuthHandler,
  appleAuthHandler,
} from '../controllers/authController';

const router = Router();

router.post('/auth/login', validateBody(loginSchema), loginHandler);
router.post('/auth/google', googleAuthHandler);
router.post('/auth/apple', appleAuthHandler);

export default router;
