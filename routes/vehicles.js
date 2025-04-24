// src/routes/vehicleRoutes.js
import express from 'express';
import { createVehicle, getVehicles, removeVehicle, setDefaultVehicle} from '../controllers/vehicleController.js';
import passport from '../middlewares/passport.js';
const router = express.Router();

// Todas las rutas de vehículos requieren autenticación
router.use(passport.authenticate('jwt', { session: false }));

router.post('/', createVehicle);
router.get('/', getVehicles);
router.delete('/:id', removeVehicle);
// router.get('/default', vehicleController.getDefaultVehicle;
router.put('/default/:vehicleId', setDefaultVehicle);
// router.get('/:vehicleId', vehicleController.getVehicleById);
// router.delete('/:vehicleId', vehicleController.deleteVehicle);
export default router;