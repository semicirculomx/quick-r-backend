import express from 'express';
import { 
  getOperadores, 
  registerOperador, 
  getAvailableOperadores, 
  updateOperadorStatus, 
  completeOrderAndUpdateOperador 
} from '../controllers/operadorController.js';
import { authenticate, isAdmin, isOperator } from '../middlewares/authMiddleware.js';

const router = express.Router();
// Todas las rutas de órdenes requieren autenticación
router.use(authenticate);

router.get('/', getOperadores);
router.post('/', registerOperador);
router.get('/available', getAvailableOperadores);
router.put('/:id/status', updateOperadorStatus);
router.post('/completeOrder', completeOrderAndUpdateOperador);

export default router;
