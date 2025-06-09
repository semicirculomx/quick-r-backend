// src/controllers/orderController.js
import { io } from '../app.js';
import Order from '../models/Order.js';

import { 
    createOrder, 
    updateOrderStatus, 
    assignOperator, 
    acceptOrder,
    completeOrder,
    cancelOrder,
    addServiceToOrder,
    rateOrder,
    processingOrder,
    reviewedOrder,
    findAssignedOrdersByOperatorId
  } from '../services/orderService.js';
  
  export const createNewOrder = async (req, res) => {
    try {
      const user = req.user;
      const orderData = req.body;
      const result = await createOrder(user, orderData);
      res.status(201).json({ success: true, order: result });
    } catch (error) {
      console.log(error.message);
      res.status(400).json({ error: error.message });
    }
  };
  
// Controlador para obtener las órdenes de un usuario
export const myOrders = async (req, res) => {
    try {
        // Obtener el ID del usuario desde el token JWT
        const userId = req.user._id;

        // Buscar todas las órdenes del usuario autenticado
        const orders = await Order.find({ user: userId }).populate('service vehicle address operator additionalServices').sort({ createdAt: -1 })
        // Verificar si el usuario tiene órdenes
        // Devolver las órdenes encontradas
        res.status(200).json({
            success: true,
            orders: orders || [],
        });

    } catch (error) {
        console.error('Error al obtener las órdenes del usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Hubo un error al obtener las órdenes del usuario.',
        });
    }
};

  export const updateStatus = async (req, res) => {
    try {
      // Este endpoint debería ser solo para admins
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'No autorizado' });
      }
      
      const orderId = req.params.id;
      const { status } = req.body;
      const adminId = req.user.id;
      const updatedOrder = await updateOrderStatus(orderId, status, adminId);
      res.status(200).json({ success: true, order: updatedOrder });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };
  
  export const confirmOrder = async (req, res) => {
    try {
      const orderId = req.params.id;

      const order = await acceptOrder(orderId);
      io.to(`order_${orderId}`).emit('orderUpdated', order);
      res.status(200).json({success: true, order: order});
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };
  
  export const assignOrderOperator = async (req, res) => {
    try {
      // Este endpoint debería ser solo para admins

      const orderId = req.params.id;
      const { operatorId } = req.body;
      const updatedOrder = await assignOperator(orderId, operatorId);
      io.to(`order_${orderId}`).emit('orderUpdated', updatedOrder);
      res.status(200).json({success: true, order: updatedOrder});
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };
  
    
  export const inProcessOrder = async (req, res) => {
    try {
      const orderId = req.params.id;
      const order = await processingOrder(orderId);
      io.to(`order_${orderId}`).emit('orderUpdated', order);
      res.status(200).json({success: true, order: order});
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  export const completeAssignedOrder = async (req, res) => {
    try {
      
      const orderId = req.params.id;
      const order = await completeOrder(orderId);
      io.to(`order_${orderId}`).emit('orderUpdated', order);
      res.status(200).json({success: true, order: order});
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  export const completeReview = async (req, res) => {
    try {
      const orderId = req.params.id;
      const order = await reviewedOrder(orderId);
      io.to(`order_${orderId}`).emit('orderUpdated', order);
      res.status(200).json({success: true, order: order});
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };
  
  export const cancelUserOrder = async (req, res) => {
    try {
      const orderId = req.params.id;
      const userId = req.user._id;
      const { reason } = req.body;
      const order = await cancelOrder(orderId, userId, reason);
      res.status(200).json({success: true, order});
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };
  
  export const addServiceToExistingOrder = async (req, res) => {
    try {
      const orderId = req.params.id;
      const userId = req.user._id;
      const { serviceId } = req.body;
      const result = await addServiceToOrder(orderId, userId, serviceId);
      res.status(200).json({ success: true, order: result });
    } catch (error) {
      res.status(400).json({ error: error.message, sucess: false });
    }
  };
  
  export const rateCompletedOrder = async (req, res) => {
    try {
      const orderId = req.params.id;
      const userId = req.user._id;
      const { rating, comment } = req.body;
      const order = await rateOrder(orderId, userId, rating, comment);
      res.status(200).json({ success: true, order });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  //for operator
  export const getAssignedOrdersForOperator = async (req, res) => {
    try {
        // The `isOperator` middleware should attach the operator's ID to req.user.id
        const operatorId = req.user._id; // Assuming req.user.id holds the operator's ID

        const assignedOrders = await findAssignedOrdersByOperatorId(operatorId);

        if (!assignedOrders || assignedOrders.length === 0) {
            return res.status(200).json({
            success: true,
            message: 'No orders assigned to this operator found.',
            orders: []
        });
        }

        return res.status(200).json({
            success: true,
            message: 'Assigned orders retrieved successfully.',
            orders: assignedOrders
        });

    } catch (error) {
        console.error("Error in getAssignedOrdersForOperator:", error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching assigned orders.',
            error: error.message
        });
    }
};