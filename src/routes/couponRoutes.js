import express from 'express';
import { createNewCoupon, validateCouponCode } from '../controllers/couponController.js';
import { authenticate, isAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

/* Validar cupón (público) */
router.post('/validate', validateCouponCode);

/* Crear cupón (admin) */
router.post('/', authenticate, isAdmin, createNewCoupon);

export default router;
