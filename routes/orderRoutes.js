// src/routes/orderRoutes.js
import express from 'express';
import { 
  createNewOrder, 
  updateStatus, 
  assignOrderOperator, 
  acceptAssignedOrder,
  completeAssignedOrder,
  cancelUserOrder,
  addServiceToExistingOrder,
  rateCompletedOrder
} from '../controllers/orderController.js';
import { authenticate, isAdmin, isOperator } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Todas las rutas de órdenes requieren autenticación
router.use(authenticate);

// Rutas para clientes
router.post('/', createNewOrder);
router.post('/:id/cancel', cancelUserOrder);
router.post('/:id/service', addServiceToExistingOrder);
router.post('/:id/rate', rateCompletedOrder);

// Rutas para administradores
router.put('/:id/status', isAdmin, updateStatus);
router.put('/:id/assign', isAdmin, assignOrderOperator);

// Rutas para operadores
router.put('/:id/accept', isOperator, acceptAssignedOrder);
router.put('/:id/arrived', isOperator, arrivedToOrder);
router.put('/:id/complete', isOperator, completeAssignedOrder);

export default router;