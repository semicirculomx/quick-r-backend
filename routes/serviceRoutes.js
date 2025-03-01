// src/routes/serviceRoutes.js
import express from 'express';
import { 
  addService, 
  getAllServicesList, 
  getServicesByCategoryList, 
  updateServiceDetails 
} from '../controllers/serviceController.js';
import { authenticate, isAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rutas públicas
router.get('/', getAllServicesList);
router.get('/category/:category', getServicesByCategoryList);

// Rutas protegidas para administradores
router.post('/', authenticate, isAdmin, addService);
router.put('/:id', authenticate, isAdmin, updateServiceDetails);

export default router;