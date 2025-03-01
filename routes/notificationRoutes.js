// src/routes/notificationRoutes.js
import express from 'express';
import { updatePushToken } from '../controllers/notificationController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Ruta para actualizar token de notificaciones
router.put('/token', authenticate, updatePushToken);

export default router;