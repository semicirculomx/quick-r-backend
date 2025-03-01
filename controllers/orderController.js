// src/controllers/orderController.js
import { 
    createOrder, 
    updateOrderStatus, 
    assignOperator, 
    acceptOrder,
    completeOrder,
    cancelOrder,
    addServiceToOrder,
    rateOrder
  } from '../services/orderService.js';
  
  export const createNewOrder = async (req, res) => {
    try {
      const userId = req.user.id;
      const orderData = req.body;
      const result = await createOrder(userId, orderData);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
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
      res.status(200).json(updatedOrder);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };
  
  export const assignOrderOperator = async (req, res) => {
    try {
      // Este endpoint debería ser solo para admins
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'No autorizado' });
      }
      
      const orderId = req.params.id;
      const { operatorId } = req.body;
      const adminId = req.user.id;
      const updatedOrder = await assignOperator(orderId, operatorId, adminId);
      res.status(200).json(updatedOrder);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };
  
  export const acceptAssignedOrder = async (req, res) => {
    try {
      // Este endpoint debería ser solo para operadores
      if (req.user.role !== 'operator') {
        return res.status(403).json({ error: 'No autorizado' });
      }
      
      const orderId = req.params.id;
      const operatorId = req.user.id;
      const order = await acceptOrder(orderId, operatorId);
      res.status(200).json(order);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };
  
  export const completeAssignedOrder = async (req, res) => {
    try {
      // Este endpoint debería ser solo para operadores
      if (req.user.role !== 'operator') {
        return res.status(403).json({ error: 'No autorizado' });
      }
      
      const orderId = req.params.id;
      const operatorId = req.user.id;
      const order = await completeOrder(orderId, operatorId);
      res.status(200).json(order);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };
  
  export const cancelUserOrder = async (req, res) => {
    try {
      const orderId = req.params.id;
      const userId = req.user.id;
      const { reason } = req.body;
      const order = await cancelOrder(orderId, userId, reason);
      res.status(200).json(order);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };
  
  export const addServiceToExistingOrder = async (req, res) => {
    try {
      const orderId = req.params.id;
      const userId = req.user.id;
      const { serviceId } = req.body;
      const result = await addServiceToOrder(orderId, userId, serviceId);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };
  
  export const rateCompletedOrder = async (req, res) => {
    try {
      const orderId = req.params.id;
      const userId = req.user.id;
      const { rating, comment } = req.body;
      const order = await rateOrder(orderId, userId, rating, comment);
      res.status(200).json(order);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };