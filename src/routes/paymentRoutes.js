import express from 'express';
import { confirmOrderPayment, requestRefund } from '../controllers/paymentController.js';
import { authenticate, isAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

/* Confirmar pago (cliente) */
router.post('/confirm', authenticate, confirmOrderPayment);

/* Procesar reembolso (admin) */
router.post('/refund/:id', authenticate, isAdmin, requestRefund);

export default router;
