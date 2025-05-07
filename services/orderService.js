// src/services/orderService.js
import Order from '../models/Order.js';
import Service from '../models/Service.js';
import Vehicle from '../models/Vehicle.js';
import Address from '../models/Address.js';
import User from '../models/User.js';
import Coupon from '../models/Coupon.js';
import mongoose from 'mongoose';
const stripeSecretKey = 'sk_test_51R8cYRB4QzGA4dWXBAQy2jgHo0PWKUMEP7j8hhwOhOaRk3Faw0AMbZWhgNhY5nuKOURK7q2vhNboXmj5aB8Y3OVS00SpyONtgZ';
const stripeClient = new stripe(stripeSecretKey);

/**
 * Servicio para gestionar las órdenes de servicio
 */
  /**
   * Crea una nueva orden de servicio
   * @param {Object} orderData - Datos de la orden
   * @returns {Promise<Object>} - Orden creada
   */
  export const createOrder = async (orderData) => {
    const session = await mongoose.startSession();
    
    try {
      session.startTransaction();
      
      // Validar datos requeridos
      const { serviceId, userId, vehicleId, addressId, paymentMethodId, scheduled, totalAmount } = orderData;
      
      if (!serviceId || !userId || !vehicleId || !addressId || !paymentMethodId || !scheduled) {
        throw new Error('Faltan datos requeridos para crear la orden');
      }
      
      // Verificar que el servicio exista
      const service = await Service.findById(serviceId);
      if (!service) {
        throw error('El servicio no existe');
      }
      
      // Verificar que el vehículo exista y pertenezca al usuario
      const vehicle = await Vehicle.findOne({ _id: vehicleId, userId });
      if (!vehicle) {
        throw new Error('El vehículo no existe o no pertenece al usuario');
      }
      
      // Verificar que la dirección exista y pertenezca al usuario
      const address = await Address.findOne({ _id: addressId, userId });
      if (!address) {
        throw new Error('La dirección no existe o no pertenece al usuario');
      }
      
      // Verificar que el usuario exista
      const user = req.user;
      
      // Calcular precio con cupón si aplica
      let finalAmount = totalAmount;
      let discount = 0;
      let couponApplied = null;
      
      if (orderData.coupon) {
        const coupon = await Coupon.findOne({ 
          code: orderData.coupon,
          isActive: true,
          expiresAt: { $gt: new Date() } 
        });
        
        if (coupon) {
          if (coupon.type === 'percentage') {
            discount = (totalAmount * coupon.value) / 100;
          } else if (coupon.type === 'fixed') {
            discount = coupon.value;
          }
          
          finalAmount = Math.max(0, totalAmount - discount);
          couponApplied = coupon._id;
        }
      }
      
      // Procesar el pago
      let paymentIntent;
      try {
        paymentIntent = await stripeClient.paymentIntents.create({
          amount: finalAmount * 100, // En centavos para Stripe
          currency: 'mxn',
          customer: user.stripeCustomerId,
          payment_method: paymentMethodId,
          confirm: true,
          description: `Orden de servicio: ${service.title}`,
          metadata: {
            serviceId: serviceId,
            userId: userId,
            vehicleId: vehicleId,
            addressId: addressId,
            scheduled: scheduled
          }
        });
      } catch (err) {
        // Si hay error en el pago, lanzar excepción
        throw new Error(`Error al procesar el pago: ${err.message}`);
      }
      
      // Crear la orden
      const newOrder = new Order({
        userId,
        serviceId,
        vehicleId,
        addressId,
        scheduled: scheduled,
        paymentMethodId,
        paymentIntentId: paymentIntent.id,
        status: 'pending',
        amount: finalAmount,
        coupon: couponApplied,
        createdAt: new Date()
      });
      
      await newOrder.save({ session });
      
      if (user) {
          await sendEmail({
              to: 'quickr.pedidos@gmail.com',
              subject: 'Tienes un nuevo pedido, por favor, revisa tu dashboard de ventas',
              template: `Revisa tu dashboard aqui: https://dashboard.quickr.com.mx/dashboard/orders`
          });

          if(user.pushToken) {
          await sendPushNotification(
              user.pushToken,
              '¡Orden confirmada!',
              `Tu orden con un total de $${totalAmount.toFixed(2)} ha sido confirmada y está en proceso.`,
              { orderId: newOrder._id }
          );
      }

      }
      
      // Si todo está bien, confirmar la transacción
      await session.commitTransaction();
      
      return {
        ...newOrder.toObject(),
        service: service.toObject(),
        address: address.toObject(),
        vehicle: vehicle.toObject()
      };
    } catch (error) {
      // Si hay algún error, deshacer la transacción
      await session.abortTransaction();
      throw error;
    } finally {
      // Terminar la sesión
      session.endSession();
    }
  }
  
  /**
   * Obtiene una orden por su ID
   * @param {string} orderId - ID de la orden
   * @param {string} userId - ID del usuario (para verificar permisos)
   * @returns {Promise<Object>} - Orden encontrada
   */
  export const getOrderById = async (orderId, userId) => {
    try {
      const order = await Order.findById(orderId)
        .populate('serviceId', 'title description price duration images')
        .populate('vehicleId', 'make model year plate size')
        .populate('addressId', 'address city state zipCode')
        .populate('userId', 'name email phone');
      
      if (!order) {
        throw new Error('Orden no encontrada');
      }
      
      // Verificar si el usuario tiene permisos para ver esta orden
      // (Si es el dueño de la orden o es un administrador)
      if (order.userId._id.toString() !== userId && !await this.isUserAdmin(userId)) {
        throw new Error('No tienes permisos para ver esta orden');
      }
      
      return order;
    } catch (error) {
      if (error instanceof Error || error instanceof Error) {
        throw error;
      }
      throw new Error(`Error al obtener la orden: ${error.message}`);
    }
  }
  
  /**
   * Obtiene todas las órdenes de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Array>} - Lista de órdenes
   */
 export const getUserOrders = async (userId) => {
    try {
      const orders = await Order.find({ userId })
        .sort({ createdAt: -1 })
        .populate('serviceId', 'title price images')
        .populate('vehicleId', 'make model plate');
      
      return orders;
    } catch (error) {
      throw new Error(`Error al obtener las órdenes del usuario: ${error.message}`);
    }
  }
  
  /**
   * Actualiza el estado de una orden
   * @param {string} orderId - ID de la orden
   * @param {string} status - Nuevo estado
   * @param {string} userId - ID del usuario (para verificar permisos)
   * @returns {Promise<Object>} - Orden actualizada
   */
  export const updateOrderStatus = async (orderId, status, userId) => {
    try {
      // Verificar si el usuario es administrador
      const isAdmin = await this.isUserAdmin(userId);
      if (!isAdmin) {
        throw new Error('No tienes permisos para actualizar el estado de esta orden');
      }
      
      // Validar el estado
      const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new Error('Estado de orden no válido');
      }
      
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Orden no encontrada');
      }
      
      // Si la orden se está cancelando, procesar reembolso si ya se hizo el pago
      if (status === 'cancelled' && order.paymentIntentId && order.status !== 'cancelled') {
        const refund = await stripe.refunds.create({
          payment_intent: order.paymentIntentId,
          amount: Math.round(order.totalAmount * 100), // Convertir a centavos
        });
      }
      
      // Actualizar estado
      order.status = status;
      order.updatedAt = new Date();
      
      if (status === 'confirmed') {
        order.confirmedAt = new Date();
      } else if (status === 'in_progress') {
        order.startedAt = new Date();
      } else if (status === 'completed') {
        order.completedAt = new Date();
      } else if (status === 'cancelled') {
        order.cancelledAt = new Date();
      }
      
      await order.save();
      
      // Notificar al usuario sobre el cambio de estado
      const user = await User.findById(order.user);
      const service = await Service.findById(order.service);
      
      // await notificationService.sendOrderNotification(user, {
      //   type: 'order_status_updated',
      //   orderId: order._id,
      //   serviceName: service.title,
      //   newStatus: status
      // });
      
      return order;
    } catch (error) {
      if (error instanceof Error || error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error(`Error al actualizar el estado de la orden: ${error.message}`);
    }
  }
  
  /**
   * Cancela una orden
   * @param {string} orderId - ID de la orden
   * @param {string} userId - ID del usuario
   * @param {string} reason - Motivo de cancelación
   * @returns {Promise<Object>} - Orden cancelada
   */
  export const cancelOrder = async (orderId, userId, reason) => {
    try {
      const order = await Order.findById(orderId);
      
      if (!order) {
        throw new Error('Orden no encontrada');
      }
      
      // Verificar si el usuario tiene permisos para cancelar esta orden
      if (order.userId.toString() !== userId && !await this.isUserAdmin(userId)) {
        throw new Error('No tienes permisos para cancelar esta orden');
      }
      
      // Verificar si la orden ya está cancelada
      if (order.status === 'cancelled') {
        throw new Error('Esta orden ya ha sido cancelada');
      }
      
      // Verificar si la orden ya está completada
      if (order.status === 'completed') {
        throw new Error('No se puede cancelar una orden completada');
      }
      
      // Si la orden ya está en progreso, verificar si el usuario es administrador
      if (order.status === 'in_progress' && order.userId.toString() === userId) {
        throw new Error('No puedes cancelar una orden en progreso, contacta a soporte');
      }
      
      // Procesar reembolso si ya se hizo el pago
      if (order.paymentIntentId) {
        await stripeClient.refunds.create({
          payment_intent: order.paymentIntentId,
          amount: Math.round(order.totalAmount * 100), // Convertir a centavos
        });
      }
      
      // Actualizar estado
      order.status = 'cancelled';
      order.cancelReason = reason || 'Cancelado por el usuario';
      order.cancelledAt = new Date();
      order.updatedAt = new Date();
      
      await order.save();
      
      // Notificar al usuario sobre la cancelación
      const user = await User.findById(order.user);
      const service = await Service.findById(order.service);
      
      // await notificationService.sendOrderNotification(user, {
      //   type: 'order_cancelled',
      //   orderId: order._id,
      //   serviceName: service.title,
      //   reason: order.cancelReason
      // });
      
      return order;
    } catch (error) {
      if (error instanceof Error || error instanceof Error) {
        throw error;
      }
      throw new Error(`Error al cancelar la orden: ${error.message}`);
    }
  }
  
  /**
   * Verifica si un usuario es administrador
   * @param {string} userId - ID del usuario
   * @returns {Promise<boolean>} - true si es admin, false en caso contrario
   */
  export const isUserAdmin = async (userId) => {
    try {
      const user = await User.findById(userId);
      return user && user.role === 'admin';
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Obtiene el historial de órdenes para el panel de administración
   * @param {Object} filters - Filtros (estado, fechas, etc.)
   * @param {number} page - Número de página
   * @param {number} limit - Límite de resultados por página
   * @returns {Promise<Object>} - Resultados paginados
   */
  export const getOrdersForAdmin = async (filters = {}, page = 1, limit = 20) => {
    try {
      const query = {};
      
      // Aplicar filtros
      if (filters.status) {
        query.status = filters.status;
      }
      
      if (filters.startDate && filters.endDate) {
        query.createdAt = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate)
        };
      }
      
      if (filters.userId) {
        query.userId = filters.userId;
      }
      
      if (filters.serviceId) {
        query.serviceId = filters.serviceId;
      }
      
      // Calcular skip para paginación
      const skip = (page - 1) * limit;
      
      // Obtener total de documentos para paginación
      const total = await Order.countDocuments(query);
      
      // Obtener órdenes con paginación
      const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('serviceId', 'title price images')
        .populate('vehicleId', 'make model plate')
        .populate('userId', 'name email phone')
        .populate('addressId', 'address city state');
      
      return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        data: orders
      };
    } catch (error) {
      throw new Error(`Error al obtener las órdenes: ${error.message}`);
    }
  }

  /**
 * Asigna un operador a una orden
 * @param {string} orderId - ID de la orden
 * @param {string} operatorId - ID del operador
 * @param {string} adminId - ID del administrador que realiza la asignación
 * @returns {Promise<Object>} - Orden actualizada
 */
export const assignOperator = async (orderId, operatorId, adminId) => {
  try {
    // Verificar si el usuario es administrador
    const isAdmin = await isUserAdmin(adminId);
    if (!isAdmin) {
      throw new Error('No tienes permisos para asignar operadores');
    }

    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new Error('Orden no encontrada');
    }
    
    if (order.status !== 'pending' && order.status !== 'confirmed') {
      throw new Error('La orden no está en un estado que permita asignar operador');
    }
    
    // Verificar que el operador exista y sea un operador válido
    const operator = await User.findOne({ _id: operatorId, role: 'operator' });
    if (!operator) {
      throw new Error('Operador no válido');
    }
    
    // Actualizar orden
    order.operator = operatorId;
    order.status = 'assigned';
    order.assignedAt = new Date();
    
    await order.save();
    
    // Notificar al operador
    if (operator.pushToken) {
      await sendPushNotification(
        operator.pushToken,
        'Nuevo servicio asignado',
        `Se te ha asignado un nuevo servicio. Por favor revisa tus asignaciones.`,
        { orderId: order._id }
      );
    }
    
    return order;
  } catch (error) {
    throw error;
  }
};

/**
 * El operador acepta la orden asignada
 * @param {string} orderId - ID de la orden
 * @param {string} operatorId - ID del operador
 * @returns {Promise<Object>} - Orden actualizada
 */
export const acceptOrder = async (orderId, operatorId) => {
  try {
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new Error('Orden no encontrada');
    }
    
    if (!order.operator || order.operator.toString() !== operatorId) {
      throw new Error('No estás asignado a esta orden');
    }
    
    if (order.status !== 'assigned') {
      throw new Error('La orden no está en estado asignado');
    }
    
    // Actualizar orden
    order.status = 'in_progress';
    order.startTime = new Date();
    order.updatedAt = new Date();
    
    await order.save();
    
    // Notificar al cliente
    const user = await User.findById(order.userId);
    
    if (user && user.pushToken) {
      await sendPushNotification(
        user.pushToken,
        'Tu servicio ha comenzado',
        `El técnico ha iniciado tu servicio.`,
        { orderId: order._id }
      );
    }
    
    return order;
  } catch (error) {
    throw error;
  }
};

/**
 * El operador completa la orden
 * @param {string} orderId - ID de la orden
 * @param {string} operatorId - ID del operador
 * @returns {Promise<Object>} - Orden actualizada
 */
export const completeOrder = async (orderId, operatorId) => {
  try {
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new Error('Orden no encontrada');
    }
    
    if (!order.operator || order.operator.toString() !== operatorId) {
      throw new Error('No estás asignado a esta orden');
    }
    
    if (order.status !== 'in_progress') {
      throw new Error('La orden no está en progreso');
    }
    
    // Actualizar orden
    order.status = 'completed';
    order.endTime = new Date();
    order.updatedAt = new Date();
    
    await order.save();
    
    // Notificar al cliente
    const user = await User.findById(order.userId);
    const service = await Service.findById(order.serviceId);
    
    if (user && user.pushToken) {
      await sendPushNotification(
        user.pushToken,
        'Servicio completado',
        `Tu servicio de ${service.title} ha sido completado. ¿Te gustaría calificar tu experiencia?`,
        { 
          orderId: order._id,
          action: 'rate_service'
        }
      );
    }
    
    return order;
  } catch (error) {
    throw error;
  }
};

/**
 * Agrega un servicio adicional a una orden existente
 * @param {string} orderId - ID de la orden
 * @param {string} userId - ID del usuario
 * @param {string} serviceId - ID del servicio a agregar
 * @returns {Promise<Object>} - Orden actualizada y datos del pago adicional
 */
export const addServiceToOrder = async (orderId, userId, serviceId) => {
  try {
    // Obtener la orden
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new Error('Orden no encontrada');
    }
    
    // Verificar si el usuario es el dueño de la orden
    if (order.userId.toString() !== userId) {
      throw new Error('No autorizado para modificar esta orden');
    }
    
    // Verificar que la orden esté en un estado que permita modificaciones
    if (order.status !== 'pending' && order.status !== 'confirmed' && 
        order.status !== 'assigned' && order.status !== 'in_progress') {
      throw new Error('No se puede modificar la orden en su estado actual');
    }
    
    // Obtener el servicio a agregar
    const service = await Service.findById(serviceId);
    
    if (!service) {
      throw new Error('Servicio no encontrado');
    }
    
    // Obtener el vehículo para calcular el precio según tamaño
    const vehicle = await Vehicle.findById(order.vehicleId);
    
    // Calcular precio del servicio según tamaño del vehículo
    const price = service.priceBySize[vehicle.size.toLowerCase()] || service.basePrice || service.price;
    
    // Agregar servicio adicional
    if (!order.additionalServices) {
      order.additionalServices = [];
    }
    
    order.additionalServices.push({
      service: serviceId,
      name: service.title,
      price: price
    });
    
    // Actualizar montos
    order.additionalAmount = (order.additionalAmount || 0) + price;
    order.totalAmount = (order.totalAmount || order.amount) + price;
    order.updatedAt = new Date();
    
    // Si el pago es con tarjeta, crear intención de pago por la diferencia
    let paymentIntentId = null;
    let paymentIntentClientSecret = null;
    
    if (order.paymentMethodId && price > 0) {
      // Obtener el usuario
      const user = await User.findById(userId);
      
      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: Math.round(price * 100), // En centavos para Stripe
        currency: 'mxn',
        customer: user.stripeCustomerId,
        payment_method: order.paymentMethodId,
        confirm: true,
        description: `Servicio adicional para orden ${order._id}`,
        metadata: {
          orderId: order._id.toString(),
          serviceId: serviceId,
          userId: userId
        }
      });
      
      paymentIntentId = paymentIntent.id;
      paymentIntentClientSecret = paymentIntent.client_secret;
      
      // Guardar referencia al pago adicional
      if (!order.additionalPayments) {
        order.additionalPayments = [];
      }
      
      order.additionalPayments.push({
        amount: price,
        paymentIntentId: paymentIntentId,
        status: 'completed'
      });
    }
    
    await order.save();
    
    // Notificar al operador si hay uno asignado
    if (order.operator) {
      const operator = await User.findById(order.operator);
      
      if (operator && operator.pushToken) {
        await sendPushNotification(
          operator.pushToken,
          'Servicio adicional agregado',
          `Se ha agregado un servicio adicional a la orden que estás atendiendo.`,
          { orderId: order._id }
        );
      }
    }
    
    return {
      order: order.toObject(),
      paymentIntentClientSecret
    };
  } catch (error) {
    throw error;
  }
};

/**
 * El usuario califica una orden completada
 * @param {string} orderId - ID de la orden
 * @param {string} userId - ID del usuario
 * @param {number} rating - Calificación (1-5)
 * @param {string} comment - Comentario opcional
 * @returns {Promise<Object>} - Orden actualizada
 */
export const rateOrder = async (orderId, userId, rating, comment) => {
  try {
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new Error('Orden no encontrada');
    }
    
    // Verificar si el usuario es el dueño de la orden
    if (order.userId.toString() !== userId) {
      throw new Error('No autorizado para calificar esta orden');
    }
    
    // Verificar que la orden esté completada
    if (order.status !== 'completed') {
      throw new Error('Solo se pueden calificar órdenes completadas');
    }
    
    // Validar calificación
    if (rating < 1 || rating > 5) {
      throw new Error('La calificación debe ser entre 1 y 5');
    }
    
    // Actualizar la calificación
    order.rating = {
      score: rating,
      comment: comment || '',
      date: new Date()
    };
    
    order.updatedAt = new Date();
    
    await order.save();
    
    // Si hay un operador asignado, actualizar su calificación promedio
    if (order.operator) {
      const operator = await User.findById(order.operator);
      
      if (operator) {
        // Calcular nueva calificación promedio
        const completedOrders = await Order.find({
          operator: order.operator,
          status: 'completed',
          'rating.score': { $exists: true }
        });
        
        const totalRatings = completedOrders.length;
        const sumRatings = completedOrders.reduce(
          (sum, order) => sum + order.rating.score,
          0
        );
        
        const avgRating = totalRatings > 0 ? sumRatings / totalRatings : 0;
        
        // Actualizar calificación del operador
        operator.rating = {
          average: avgRating,
          count: totalRatings
        };
        
        await operator.save();
      }
    }
    
    return order;
  } catch (error) {
    throw error;
  }
};