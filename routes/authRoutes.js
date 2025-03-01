// src/routes/authRoutes.js
import express from 'express';
import { registerUser, loginUser, googleAuth } from '../controllers/authController.js';

const router = express.Router();

// Rutas de autenticación
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuth);

export default router;

