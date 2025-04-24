import express from 'express';
import passport from '../middlewares/passport.js';
import createService from '../controllers/services/createServices.js';
import updateService from '../controllers/services/updateServices.js';
import deleteService from '../controllers/services/deleteServices.js';
import getAllServices from '../controllers/services/getServices.js';
import getTopOrderedServices from '../controllers/services/getTopOrderedServices.js';
import readOne from '../controllers/services/readOne.js';
import validator from '../middlewares/validator.js';
import { isAdmin } from '../middlewares/isAdmin.js';


const router = express.Router();

// Ruta para obtener todos los productos
router.get('/', getAllServices);
// Ruta para traer los productos mas pedidos de la sección "lo mas pedido"
router.get('/top-ordered-services', getTopOrderedServices);

// Ruta para crear un nuevo producto
router.post('/',   createService);

// Ruta para obtener un producto específico por ID
router.get('/:id', readOne);

// Ruta para actualizar un producto existente por ID
router.put('/:id', updateService);

// Ruta para eliminar un producto por ID
router.delete('/:id', deleteService);


export default router;


// // src/routes/serviceRoutes.js
// import express from 'express';
// import { 
//   addService, 
//   getAllServicesList, 
//   getServicesByCategoryList, 
//   updateServiceDetails 
// } from '../controllers/serviceController.js';
// import passport from '../middlewares/passport.js';
// import { isAdmin } from '../middlewares/isAdmin.js';

// const router = express.Router();

// // Rutas públicas
// router.get('/', getAllServicesList);
// router.get('/category/:category', getServicesByCategoryList);

// // Rutas protegidas para administradores
// router.post('/',  addService);
// router.put('/:id', updateServiceDetails);

// export default router;