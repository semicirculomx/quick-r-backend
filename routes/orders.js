import express from 'express';
import passport from '../middlewares/passport.js';
import createOrder from '../controllers/orders/createOrder.js';
import updateOrder from '../controllers/orders/updateOrder.js';
import getLastOrders from '../controllers/orders/getLastOrders.js';
import getAllOrders from '../controllers/orders/getAllOrders.js';
import addressExist from '../middlewares/addressExist.js';
import { emptyCart } from '../middlewares/emptyCart.js';
import totalOrders from '../controllers/orders/totalOrders.js';
import getTotalRevenue from '../controllers/orders/totalRevenue.js';
import readOrder from '../controllers/orders/readOrder.js';
import deleteOrder from '../controllers/orders/deleteOrder.js';
import deleteOrders from '../controllers/orders/deleteOrders.js';
import { isAdmin } from '../middlewares/isAdmin.js';
import {
    createNewOrder,
    updateStatus,
    assignOrderOperator,
    confirmOrder,
    completeAssignedOrder,
    cancelUserOrder,
    addServiceToExistingOrder,
    rateCompletedOrder,
    inProcessOrder,
    completeReview,
    myOrders,
    getAssignedOrdersForOperator 
  } from '../controllers/orderController.js';
import { isOperator } from '../middlewares/isOperator.js'; // Ensure this middleware is correctly implemented
const router = express.Router();


router.get('/reverse-geocode', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const geocodeKey = process.env.GEOCODE_APIKEY; // Securely stored in backend
    const { lat, lng } = req.query;

    if (!lat || !lng) {
        return res.status(400).json({ error: "Latitude and longitude are required." });
    }

    try {
        const response = await fetch(
            `https://geocode.maps.co/reverse?lat=${lat}&lon=${lng}&api_key=${geocodeKey}`
        );

        const data = await response.json();

        res.json(data);
    } catch (error) {
        console.error("Error fetching reverse geocode data:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

router.get('/geocode', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const geocodeKey = process.env.GOOGLE_MAPS_APIKEY; // Securely stored in backend
    const { address } = req.query;

    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${geocodeKey}`);
    const data = await response.json();

    res.json(data);
});
// Ruta para ver mis órdenes (debe ir antes de las rutas con parámetros dinámicos)
router.get('/my-orders', passport.authenticate('jwt', { session: false }), myOrders);
// Rutas para operadores
router.get('/assigned', passport.authenticate('jwt', { session: false }),
//  isOperator,
 getAssignedOrdersForOperator); // <--- NEW ROUTE
// Ruta para crear una nueva orden
router.post('/', passport.authenticate('jwt', { session: false }), addressExist, createNewOrder);
// Ruta para obtener el total de ingresos por órdenes
router.get('/total-revenue', passport.authenticate('jwt', { session: false }), isAdmin, getTotalRevenue);

// Ruta para obtener las órdenes de las últimas 24 horas
router.get('/last-orders', passport.authenticate('jwt', { session: false }), isAdmin, getLastOrders);

// Ruta para obtener el total de órdenes
router.get('/total-orders', passport.authenticate('jwt', { session: false }), isAdmin, totalOrders);

// Ruta para leer una orden específica por ID
router.get('/:id', passport.authenticate('jwt', { session: false }), readOrder);

router.put('/:id/cancel', passport.authenticate('jwt', { session: false }), cancelUserOrder);
router.put('/:id/additional-service', passport.authenticate('jwt', { session: false }), addServiceToExistingOrder);
router.put('/:id/rate', passport.authenticate('jwt', { session: false }), rateCompletedOrder);
router.put('/:id/verification',
        //isOwner,
    completeReview);

router.put('/:id/accept',
    //isAdmin,
    confirmOrder);

router.put('/:id/assign',
   // isAdmin,
    assignOrderOperator);

router.put('/:id/in_progress',
        // isOperator,
    inProcessOrder);

router.put('/:id/complete',
    //isOperator,
    completeAssignedOrder);

router.put('/:id/status',
    //isAdmin,
     updateStatus);

// Ruta para actualizar una orden existente
router.patch('/:id', passport.authenticate('jwt', { session: false }), isAdmin, updateOrder);

// Ruta para eliminar una orden específica por ID
router.delete('/:id', passport.authenticate('jwt', { session: false }), isAdmin, deleteOrder);

// Ruta para obtener todas las órdenes
router.get('/', passport.authenticate('jwt', { session: false }), isAdmin, getAllOrders);

// Ruta para eliminar todas las ordenes
router.delete('/', passport.authenticate('jwt', { session: false }), isAdmin, deleteOrders);

export default router;
