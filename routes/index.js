// Importamos el módulo Express
import express from 'express';
import usersRouter from './users.js'; // Enrutador para las rutas de usuarios
import categoriesRouter from './categories.js';
import subcategoriesRouter from './subcategories.js'
import cartsRouter from './carts.js'
import couponsRouter from './coupons.js'
import favoritesRouter from './favorites.js'
import paymentsRouter from './payments.js'
import ordersRoutes from './orders.js'
import bannersRoutes from './banners.js'
import utilsRoutes from './utils.js'
import addressesRoutes from './addresses.js'
import vehicleRoutes from './vehicles.js'
import servicesRouter from './services.js'
import timeSlotsRouter from './timeSlots.js'; // Placeholder for time slots, to be implemented later
// Creamos un nuevo objeto router
const router = express.Router();

router.use('/users', usersRouter); // Usar el enrutador para rutas de usuarios
router.use('/categories', categoriesRouter)
router.use('/subcategories', subcategoriesRouter)
router.use('/carts', cartsRouter)
router.use('/favorites', favoritesRouter)
router.use('/coupons', couponsRouter)
router.use('/payments', paymentsRouter)
router.use('/orders', ordersRoutes)
router.use('/banners', bannersRoutes)
router.use('/utils', utilsRoutes)
router.use('/addresses', addressesRoutes)
router.use('/vehicles', vehicleRoutes)
router.use('/services', servicesRouter)
router.use('/time-slots', timeSlotsRouter); // Placeholder for time slots, to be implemented later
// Exportamos el objeto router
export default router;
