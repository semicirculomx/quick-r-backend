import express from 'express';
import * as addressController from '../controllers/addressController.js';
import passport from '../middlewares/passport.js';


const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas de direcciones
router.use(passport.authenticate('jwt', { session: false }));

// Rutas para gestión de direcciones
router.post('/', addressController.createAddress);
router.get('/', addressController.getUserAddresses);
router.get('/default', addressController.getDefaultAddress);
router.put('/default/:addressId', addressController.setDefaultAddress);
router.get('/:addressId', addressController.getAddressById);
router.put('/:addressId', addressController.updateAddress);
router.delete('/:addressId', addressController.deleteAddress);

// Ruta para buscar direcciones cercanas (solo para administradores)
router.post('/nearby', addressController.findNearbyAddresses);

export default router;