import express from 'express';
import authRoutes from './authRoutes.js';
import notificacionRoutes from './notificationRoutes.js';
import operadorRoutes from './operatorRoutes.js';
import ordenRoutes from './orderRoutes.js';
import pagoRoutes from './paymentRoutes.js';
import servicioRoutes from './serviceRoutes.js';
import usuarioRoutes from './userRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
//router.use('/categories', categoriesRouter)
router.use('/notifications', notificacionRoutes);
router.use('/operators', operadorRoutes);
router.use('/orders', ordenRoutes);
router.use('/payments', pagoRoutes);
router.use('/services', servicioRoutes);
router.use('/users', usuarioRoutes);

export default router;
