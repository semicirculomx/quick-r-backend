// src/routes/vehicleRoutes.js
import express from 'express';
import { createVehicle, getVehicles, removeVehicle } from '../controllers/vehicleController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Todas las rutas de vehículos requieren autenticación
router.use(authenticate);

router.post('/', createVehicle);
router.get('/', getVehicles);
router.delete('/:id', removeVehicle);

export default router;