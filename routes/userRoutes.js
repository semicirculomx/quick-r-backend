import express from 'express';
import { getUsuarios, getUsuario, createUsuario, updateUsuario, editUsuarioAdmin, deleteUsuario } from '../controllers/usuarioController.js';

const router = express.Router();

// Rutas de usuarios
router.get('/', getUsuarios);
router.get('/:id', getUsuario);
router.post('/', createUsuario);
router.put('/:id', updateUsuario);
router.put('/:id/admin-edit', editUsuarioAdmin); // Ruta para edición de admin
router.delete('/:id', deleteUsuario);

export default router;
