// src/services/orderService.js
import Order from '../models/Order.js';
import Service from '../models/Service.js';
import Vehicle from '../models/Vehicle.js';
import Address from '../models/Address.js';
import User from '../models/User.js';
import Coupon from '../models/Coupon.js';
import mongoose from 'mongoose';
import stripe from 'stripe'

const stripeSecretKey = 'sk_test_51R8cYRB4QzGA4dWXBAQy2jgHo0PWKUMEP7j8hhwOhOaRk3Faw0AMbZWhgNhY5nuKOURK7q2vhNboXmj5aB8Y3OVS00SpyONtgZ';
const stripeClient = new stripe(stripeSecretKey);
import sendEmail from '../utils/mailing.util.js';
import { isOwnerOrAdmin } from '../middlewares/isAdmin.js';
import TimeSlot from '../models/TimeSlot.js';
import { io } from '../app.js';

const sendPushNotification = async (expoPushToken, title, body, data) => {
    const message = {
        to: expoPushToken,
        sound: 'default',
        title,
        body,
        data,
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
    });
};
/**
 * Crea una nueva orden de servicio
 * @param {string} user - obj del usuario que crea la orden
 * @param {Object} orderData - Datos de la orden
 * @returns {Promise<Object>} - Orden creada
 */
export const createOrder = async (user, orderData) => {
  const session = await mongoose.startSession();
  const userId = user._id.toString();
  try {
    session.startTransaction();
    
    // Validar datos requeridos
    const { serviceId, vehicleId, addressId, paymentMethodId, scheduled, totalAmount, isInstant } = orderData;
    
    if (!serviceId || !vehicleId || !addressId || !totalAmount) {
      throw new Error('Faltan datos requeridos para crear la orden');
    }
    
    // Verificar que el servicio exista
    const service = await Service.findById(serviceId);
    if (!service) {
      throw new Error('El servicio no existe');
    }
    
    // Verificar que el vehículo exista y pertenezca al usuario
    const vehicle = await Vehicle.findOne({ _id: vehicleId, owner: userId });
    if (!vehicle) {
      throw new Error('El vehículo no existe o no pertenece al usuario');
    }
    
    // Verificar que la dirección exista y pertenezca al usuario
    const address = await Address.findOne({ _id: addressId, user: userId });
    if (!address) {
      throw new Error('La dirección no existe o no pertenece al usuario');
    }
    
    // Calcular precio con cupón si aplica
    let finalAmount = totalAmount;
    let couponData = null;
    
    if (orderData.couponCode) { 
      const coupon = await Coupon.findOne({ 
        code: orderData.couponCode,
        isActive: true,
        expiresAt: { $gt: new Date() } 
      });
      
      if (coupon) {
        let discountAmount = 0;
        
        if (coupon.type === 'percentage') {
          discountAmount = (totalAmount * coupon.value) / 100;
        } else if (coupon.type === 'fixed') {
          discountAmount = coupon.value;
        }
        
        finalAmount = Math.max(0, totalAmount - discountAmount);
        couponData = {
          code: coupon.code,
          discountPercentage: coupon.type === 'percentage' ? coupon.value : null,
          discountAmount: discountAmount
        };
      }
    }
    
    // Procesar el pago si hay método de pago
    let paymentIntent = null;
    let paymentStatus = null;
    
    if (paymentMethodId) {
      try {
        paymentIntent = await stripeClient.paymentIntents.create({
          amount: Math.round(finalAmount * 100), // En centavos para Stripe
          currency: 'mxn',
          customer: user.stripeCustomerId,
          payment_method: paymentMethodId,
          confirm: true,
          capture_method: 'automatic',
          description: `Orden de servicio: ${service.title}`,
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: 'never'
          },
          metadata: {
            serviceId: serviceId,
            userId: userId,
            vehicleId: vehicleId,
            addressId: addressId,
          }
        });
        
        paymentStatus = paymentIntent.status;
      } catch (err) {
        // Si hay error en el pago, lanzar excepción
        throw new Error(`Error al procesar el pago: ${err.message}`);
      }
    }

    if(!isInstant) {
      const slot = await TimeSlot.findOne({
        startDateTime: scheduled,
        isAvailable: true,
      });

     if (!slot 
      // || slot.bookedCount >= slot.maxCapacity
      ) {
            throw new Error('No hay slots disponibles para la fecha seleccionada');
      }
      // Actualizar el TimeSlot para la fecha programada
      slot.bookedCount = slot.bookedCount + 1 
      await slot.save({ session });
      
    }

  // Crear la orden
    const newOrder = new Order({
      user: userId,
      service: serviceId,
      vehicle: vehicleId,
      address: addressId,
      scheduled: scheduled ? scheduled : new Date().toISOString(),
      isInstant: isInstant,
      totalAmount,
      coupon: couponData,
      finalAmount,
      paymentMethodId,
      paymentStatus,
      paymentIntentId: paymentIntent ? paymentIntent.id : null,
      status: 'pending',
      notes: orderData.notes || '',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  
    await newOrder.save({ session });

    if (user) {
      // Notificar al equipo de ventas
      await sendEmail({
        to: 'quickr.pedidos@gmail.com',
        subject: 'Tienes un nuevo pedido, por favor, revisa tu dashboard de ventas',
        template: `Revisa tu dashboard aqui: https://dashboard.quickr.com.mx/dashboard/orders`
      });

      // Notificar al usuario
      if (user.pushToken) {
        await sendPushNotification(
          user.pushToken,
          '¡Orden confirmada!',
          `Tu orden con un total de $${finalAmount.toFixed(2)} ha sido confirmada y está en proceso.`,
          { orderId: newOrder._id.toString() }
        );
      }
    }
    
    // Confirmar la transacción
    await session.commitTransaction();
    
    // Cargar referencias completas para la respuesta
    const populatedOrder = await Order.findById(newOrder._id)
      .populate('service', 'title description price images category')
      .populate('vehicle', 'plate size')
      .populate('address', 'address');
    
   return populatedOrder;
  } catch (error) {
    // Abortar la transacción en caso de error
    await session.abortTransaction();
    throw error;
  } finally {
    // Terminar la sesión
    session.endSession();
  }
};

/**
 * Obtiene una orden por su ID
 * @param {string} orderId - ID de la orden
 * @param {string} userId - ID del usuario (para verificar permisos)
 * @returns {Promise<Object>} - Orden encontrada
 */
export const getOrderById = async (orderId, userId) => {
  try {
    const order = await Order.findById(orderId)
      .populate('service', 'title description price duration images')
      .populate('vehicle', 'plate size')
      .populate('address', 'address')
      .populate('user', 'name email phone')
      .populate('operator', 'name email phone')
      .populate('additionalServices', 'title description price images');
    
    if (!order) {
      throw new Error('Orden no encontrada');
    }
    
    // Verificar si el usuario tiene permisos para ver esta orden
    const isOwner = order.user._id.toString() === userId;
    const isOperator = order.operator && order.operator._id.toString() === userId;
    const isAdmin = await isUserAdmin(userId);
    
    if (!isOwner && !isOperator && !isAdmin) {
      throw new Error('No tienes permisos para ver esta orden');
    }
    
    return order;
  } catch (error) {
    if (error instanceof Error || error instanceof Error) {
      throw error;
    }
    throw new Error(`Error al obtener la orden: ${error.message}`);
  }
};

/**
 * Obtiene todas las órdenes de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} - Lista de órdenes
 */
export const getUserOrders = async (userId) => {
  try {
    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('service', 'title price images')
      .populate('vehicle', '  plate size')
      .populate('address', 'address location')
      .populate('additionalServices');
    
    return orders;
  } catch (error) {
    throw new Error(`Error al obtener las órdenes del usuario: ${error.message}`);
  }
};

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
    const isAdmin = await isUserAdmin(userId);
    if (!isAdmin) {
      throw new Error('No tienes permisos para actualizar el estado de esta orden');
    }
    
    // Validar el estado
    const validStatuses = ['pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error('Estado de orden no válido');
    }
    
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Orden no encontrada');
    }
    
    // Si la orden se está cancelando, procesar reembolso si ya se hizo el pago
    if (status === 'cancelled' && order.paymentIntentId && order.status !== 'cancelled' && 
        order.paymentStatus === 'succeeded') {
      await stripeClient.refunds.create({
        payment_intent: order.paymentIntentId,
        amount: Math.round(order.finalAmount * 100), // Convertir a centavos
      });
      
      order.paymentStatus = 'canceled';
    }
    
    // Actualizar estado
    order.status = status;
    order.updatedAt = new Date();
    
    if (status === 'confirmed') {
      order.confirmedAt = new Date();
    } else if (status === 'in_progress') {
      order.startTime = new Date();
    } else if (status === 'completed') {
      order.finishedAt = new Date();
    } else if (status === 'cancelled') {
      order.cancellationTime = new Date();
    }
    
    await order.save();
    
    // Notificar al usuario sobre el cambio de estado
    const user = await User.findById(order.user);
    const service = await Service.findById(order.service);
    
    if (user && user.pushToken) {
      let notificationTitle, notificationBody;
      
      switch (status) {
        case 'confirmed':
          notificationTitle = 'Orden confirmada';
          notificationBody = `Tu orden para ${service.title} ha sido confirmada.`;
          break;
        case 'in_progress':
          notificationTitle = 'Servicio en progreso';
          notificationBody = `Tu servicio de ${service.title} está en proceso.`;
          break;
        case 'completed':
          notificationTitle = 'Servicio completado';
          notificationBody = `Tu servicio de ${service.title} ha sido completado. ¡Gracias por confiar en nosotros!`;
          break;
        case 'cancelled':
          notificationTitle = 'Orden cancelada';
          notificationBody = `Tu orden para ${service.title} ha sido cancelada.`;
          break;
        default:
          notificationTitle = 'Actualización de orden';
          notificationBody = `El estado de tu orden ha cambiado a ${status}.`;
      }
      
      await sendPushNotification(
        user.pushToken,
        notificationTitle,
        notificationBody,
        { 
          orderId: order._id.toString(),
          status: status
        }
      );
    }
    
    return order;
  } catch (error) {
    if (error instanceof Error || error instanceof Error) {
      throw error;
    }
    throw new Error(`Error al actualizar el estado de la orden: ${error.message}`);
  }
};

/**
 * El operador acepta la orden asignada
 * @param {string} orderId - ID de la orden
 * @param {string} operatorId - ID del operador
 * @returns {Promise<Object>} - Orden actualizada
 */
export const acceptOrder = async (orderId) => {
  try {
    const order = await Order.findById(orderId)
    .populate('service', 'title description price duration images')
    .populate('vehicle', 'plate size')
    .populate('address', 'address')
    .populate('user', 'name email phone')
    .populate('additionalServices', 'title description price images');
    
    if (!order) {
      throw new Error('Orden no encontrada');
    }
    
    if (order.status === 'confirmed') {
      throw new Error('La orden ya está confirmada');
    }
    
    // Actualizar orden
    order.status = 'confirmed';
    order.confirmedAt = new Date();
    
    await order.save();
    
    // Notificar al cliente
    // const user = await User.findById(order.user);
    // const service = await Service.findById(order.service);
    
    // if (user && user.pushToken) {
    //   await sendPushNotification(
    //     user.pushToken,
    //     'Tu servicio ha comenzado',
    //     `El técnico ha iniciado tu servicio de ${service.title}.`,
    //     { orderId: order._id.toString() }
    //   );
    // }
    
    return order;
  } catch (error) {
    if (error instanceof Error || error instanceof Error) {
      throw error;
    }
    throw new Error(`Error al aceptar la orden: ${error.message}`);
  }
};

/**
 * Asigna un operador a una orden
 * @param {string} orderId - ID de la orden
 * @param {string} operatorId - ID del operador
 * @param {string} adminId - ID del administrador que realiza la asignación
 * @returns {Promise<Object>} - Orden actualizada
 */
export const assignOperator = async (orderId, operatorId) => {
  try {
    // Verificar si el usuario es administrador

    const order = await Order.findById(orderId)
    .populate('service', 'title description price duration images')
    .populate('vehicle', 'plate size')
    .populate('address', 'address')
    .populate('user', 'name email phone')
    .populate('additionalServices', 'title description price images');
    
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
      const service = await Service.findById(order.service);
      
      await sendPushNotification(
        operator.pushToken,
        'Nuevo servicio asignado',
        `Se te ha asignado un nuevo servicio: ${service.title}. Por favor revisa tus asignaciones.`,
        { orderId: order._id.toString() }
      );
    }
    
      // Crear respuesta combinando la orden con el operador completo
    const response = {
      ...order.toObject(), // Convertir a objeto plano
      operator: operator // Añadir el operador completo
    };

    io.to(`operator_${operatorId}`).emit('newOrder', order);

    return response;
    
  } catch (error) {
    if (error instanceof Error || error instanceof Error) {
      throw error;
    }
    throw new Error(`Error al asignar operador: ${error.message}`);
  }
};
/**
 * Cambia el estado de una orden a "processing" (en proceso)
 * @param {string} orderId - ID de la orden
 * @param {string} operatorId - ID del operador que inicia el proceso
 * @returns {Promise<Object>} - Orden actualizada
 */
export const processingOrder = async (orderId) => {
  try {

    const checkOrdersStatus = await Order.find({status: 'in_progress'})

    if(checkOrdersStatus.length > 0) {
     throw new Error('Ya tienes un servicio en proceso');
    }
    // Buscar la orden y poblar datos del operador
    const order = await Order.findById(orderId)
    .populate('service', 'title description price duration images')
    .populate('vehicle', 'plate size')
    .populate('address', 'address')
    .populate('user', 'name email phone')
    .populate('operator', 'name email phone')
    .populate('additionalServices', 'title description price images');

    if (!order) {
      throw new Error('Orden no encontrada');
    }

    // Validar estado actual
    if (order.status !== 'assigned') {
      throw new Error('La orden debe estar asignada para iniciar el proceso');
    }

    // Actualizar estado
    order.status = 'in_progress';
    order.startTime = new Date();

    await order.save();

    // Notificar al usuario
    if (order.user.pushToken) {
      await sendPushNotification(
        order.user.pushToken,
        '¡Tu orden está en proceso!',
        `El operador ${order.operator.name} ha comenzado a trabajar en tu solicitud.`,
        { orderId: order._id.toString() }
      );
    }

    return order;
  } catch (error) {
    if (error instanceof Error) {
      throw error; // Relanzar errores personalizados
    }
    throw new Error(`Error al procesar la orden: ${error.message}`);
  }
};
/**
 * El operador completa la orden
 * @param {string} orderId - ID de la orden
 * @param {string} operatorId - ID del operador
 * @returns {Promise<Object>} - Orden actualizada
 */
export const completeOrder = async (orderId) => {
  try {
    const order = await Order.findById(orderId)
    .populate('service', 'title description price duration images')
    .populate('vehicle', 'plate size')
    .populate('address', 'address')
    .populate('user', 'name email phone')
    .populate('operator', 'name email phone')
    .populate('additionalServices', 'title description price images');
    
    if (!order) {
      throw new Error('Orden no encontrada');
    }
    
    if (order.status !== 'in_progress') {
      throw new Error('La orden no está en progreso');
    }
    
    // Actualizar orden
    order.status = 'in_review';
    order.finishedAt = new Date();
    
    await order.save();
    
    // Notificar al cliente
    const user = await User.findById(order.user);
    const service = await Service.findById(order.service);
    
    if (user && user.pushToken) {
      await sendPushNotification(
        user.pushToken,
        'Servicio completado',
        `Tu servicio de ${service.title} ha sido completado. ¿Te gustaría calificar tu experiencia?`,
        { 
          orderId: order._id.toString(),
          action: 'rate_service'
        }
      );
    }
    
    return order;
  } catch (error) {
    if (error instanceof Error || error instanceof Error) {
      throw error;
    }
    throw new Error(`Error al completar la orden: ${error.message}`);
  }
};

/**
 * Cambia una orden a estado "in_review" (en revisión)
 * @param {string} orderId - ID de la orden
 * @param {string} operatorId - ID del operador que solicita la revisión
 * @returns {Promise<Object>} - Orden actualizada
 */
export const reviewedOrder = async (orderId) => {
  try {
    // Buscar la orden con datos necesarios
    const order = await Order.findById(orderId)
    .populate('service', 'title description price duration images')
    .populate('vehicle', 'plate size')
    .populate('address', 'address')
    .populate('user', 'name email phone')
    .populate('operator', 'name email phone')
    .populate('additionalServices', 'title description price images');

    if (!order) {
      throw new Error('Orden no encontrada');
    }

    // Actualizar estado
    order.status = 'completed';
    order.reviewedAt = new Date();
    await order.save();

    // Notificar al usuario
    if (order.user.pushToken) {
      await sendPushNotification(
        order.user.pushToken,
        '¡Listo para revisión!',
        `El servicio "${order.service.title}" está listo para tu revisión final. Por favor verifica el trabajo realizado.`,
        { 
          orderId: order._id.toString(),
          status: 'in_review'
        }
      );
    }

    return order;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Error al poner en revisión la orden: ${error.message}`);
  }
};


/**
 * El usuario o admin cancela la orden
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
    
    // Verificar si la orden ya está cancelada
    if (order.status === 'cancelled') {
      throw new Error('Esta orden ya ha sido cancelada');
    }
    
    // Verificar si la orden ya está completada
    if (order.status === 'completed') {
      throw new Error('No se puede cancelar una orden completada');
    }
    
    // Si la orden ya está en progreso y el usuario no es admin, no permitir cancelación
    if (order.status === 'in_progress' && userId === order.user) {
      throw new Error('No puedes cancelar una orden en progreso, contacta a soporte');
    }
    
    // Procesar reembolso si ya se hizo el pago
    // if (order.paymentIntentId && order.paymentStatus === 'succeeded') {
    //   await stripeClient.refunds.create({
    //     payment_intent: order.paymentIntentId,
    //     amount: Math.round(order.finalAmount * 100), // Convertir a centavos
    //   });
      
    //   order.paymentStatus = 'canceled';
    // }
    
    // Actualizar estado
    order.status = 'cancelled';
    order.cancelReason = reason || 'Cancelado por el usuario';
    order.cancellationTime = new Date();
    
    await order.save();
    
    // Notificar al usuario sobre la cancelación
    const user = await User.findById(order.user);
    const service = await Service.findById(order.service);
    
    if (user && user.pushToken && !isOwnerOrAdmin(user._id.toString())) {
      await sendPushNotification(
        user.pushToken,
        'Orden cancelada',
        `Tu orden para ${service.title} ha sido cancelada: ${order.cancelReason}`,
        { orderId: order._id.toString() }
      );
    }
    
    // Si hay un operador asignado, notificarle también
    if (order.operator) {
      const operator = await User.findById(order.operator);
      
      if (operator && operator.pushToken) {
        await sendPushNotification(
          operator.pushToken,
          'Orden cancelada',
          `La orden para ${service.title} ha sido cancelada: ${order.cancelReason}`,
          { orderId: order._id.toString() }
        );
      }
    }
    
    return order;
  } catch (error) {
    if (error instanceof Error || error instanceof Error) {
      throw error;
    }
    throw new Error(`Error al cancelar la orden: ${error.message}`);
  }
};

/**
 * Agrega un servicio adicional a una orden existente
 * @param {string} orderId - ID de la orden
 * @param {string} userId - ID del usuario
 * @param {string} serviceId - ID del servicio a agregar
 * @returns {Promise<Object>} - Orden actualizada
 */
export const addServiceToOrder = async (orderId, userId, serviceId) => {
  try {
    // Obtener la orden
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new Error('Orden no encontrada');
    }
    
    // Verificar si el usuario tiene permisos (dueño u operador o admin)
    const isOwner = order.user.toString() === userId.toString();
    const isOperator = order.operator && order.operator.toString() === userId;
    const isAdmin = await isUserAdmin(userId);

    
    if (!isOwner && !isOperator && !isAdmin) {
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
    
    // Verificar que el servicio no esté ya añadido a la orden
    if (order.additionalServices && 
        order.additionalServices.some(s => s.toString() === serviceId)) {
      throw new Error('Este servicio ya está incluido en la orden');
    }
    
    // Obtener el vehículo para calcular el precio según tamaño
    const vehicle = await Vehicle.findById(order.vehicle);
    
    // Calcular precio del servicio según tamaño del vehículo
    const servicePrice = service.price;

    // service.priceBySize && vehicle.size ? 
    //                      service.priceBySize[vehicle.size.toLowerCase()] : 
    
    // Agregar servicio a la lista de servicios adicionales
    if (!order.additionalServices) {
      order.additionalServices = [];
    }
    
    order.additionalServices.push(serviceId);
    
    // Actualizar montos
    const newTotalAmount = order.totalAmount + servicePrice;
    const newFinalAmount = order.finalAmount + servicePrice;
    
    order.totalAmount = newTotalAmount;
    order.finalAmount = newFinalAmount;
    
    // Procesar pago adicional si es necesario
    let paymentIntent = null;
    
    if (order.paymentMethodId && servicePrice > 0 && (isOwner || isAdmin)) {
      const user = await User.findById(order.user);
      
      if (user && user.stripeCustomerId) {
        try {
          paymentIntent = await stripeClient.paymentIntents.create({
            amount: Math.round(servicePrice * 100), // En centavos para Stripe
            currency: 'mxn',
            customer: user.stripeCustomerId,
            payment_method: order.paymentMethodId,
            confirm: true,
            description: `Servicio adicional para orden ${order._id}`,
            metadata: {
              orderId: order._id.toString(),
              serviceId: serviceId,
              userId: order.user.toString(),
              note: 'servicio adicional'
            },
          capture_method: 'automatic',
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: 'never'
          },
          });
        } catch (err) {
          throw new Error(`Error al procesar el pago adicional: ${err.message}`);
        }
      }
    }
    
    await order.save();
    
    // Notificar al usuario si el cambio lo hizo el operador o admin
    if (!isOwner) {
      const user = await User.findById(order.user);
      
      if (user && user.pushToken) {
        await sendPushNotification(
          user.pushToken,
          'Servicio adicional agregado',
          `Se ha agregado el servicio ${service.title} a tu orden. El nuevo total es $${newFinalAmount.toFixed(2)}.`,
          { orderId: order._id.toString() }
        );
      }
    }
    
    // Si hay un operador asignado y el cambio no lo hizo él, notificarle
    if (order.operator && !isOperator) {
      const operator = await User.findById(order.operator);
      
      if (operator && operator.pushToken) {
        await sendPushNotification(
          operator.pushToken,
          'Servicio adicional agregado',
          `Se ha agregado el servicio ${service.title} a la orden que estás atendiendo.`,
          { orderId: order._id.toString() }
        );
      }
    }
    
    // Cargar información completa para la respuesta
    const populatedOrder = await Order.findById(order._id)
      .populate('service', 'title description price images')
      .populate('vehicle', 'plate size')
      .populate('address')
      .populate('additionalServices', 'title description price images');
    
    return {
      order: populatedOrder,
      paymentIntentClientSecret: paymentIntent ? paymentIntent.client_secret : null
    };
  } catch (error) {
    if (error instanceof Error || error instanceof Error) {
      throw error;
    }
    throw new Error(`Error al agregar servicio: ${error.message}`);
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
    if (order.user.toString() !== userId.toString()) {
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
      comment: comment || ''
    };
    
    order.updatedAt = new Date();
    
    await order.save();
    
    // Si hay un operador asignado, actualizar su calificación promedio
    if (order.operator) {
      const operator = await User.findById(order.operator);
      
      if (operator) {
        // Obtener todas las órdenes completadas por este operador que tengan calificación
        const completedOrders = await Order.find({
          operator: order.operator,
          status: 'completed',
          'rating.score': { $exists: true }
        });
        
        if (completedOrders.length > 0) {
          // Calcular calificación promedio
          const totalScore = completedOrders.reduce((sum, ord) => sum + ord.rating.score, 0);
          const avgRating = totalScore / completedOrders.length;
          
          // Actualizar datos del operador
          operator.operatorProfile.metrics.average = avgRating;
          operator.operatorProfile.metrics.average = completedOrders.length;
          
          await operator.save();
          
          // Notificar al operador
          if (operator.pushToken) {
            await sendPushNotification(
              operator.pushToken,
              'Nueva calificación recibida',
              `Has recibido una calificación de ${rating} estrellas para un servicio.`,
              { orderId: order._id.toString() }
            );
          }
        }
      }
    }
    
    return order;
  } catch (error) {
    if (error instanceof Error || error instanceof Error) {
      throw error;
    }
    throw new Error(`Error al calificar la orden: ${error.message}`);
  }
};

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
};


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
      query.user = filters.userId;
    }
    
    if (filters.serviceId) {
      query.service = filters.serviceId;
    }
    
    if (filters.operatorId) {
      query.operator = filters.operatorId;
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
      .populate('service', 'title price images')
      .populate('vehicle', 'make model plate size')
      .populate('user', 'name email phone')
      .populate('operator', 'name email phone')
      .populate('address', 'formattedAddress city state')
      .populate('additionalServices', 'title price');
    
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
};

/**
 * Obtiene estadísticas de órdenes para el panel de administración
 * @param {string} startDate - Fecha de inicio (opcional)
 * @param {string} endDate - Fecha de fin (opcional)
 * @returns {Promise<Object>} - Estadísticas
 */
export const getOrderStats = async (startDate, endDate) => {
  try {
    const dateQuery = {};
    
    if (startDate && endDate) {
      dateQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Total de órdenes
    const totalOrders = await Order.countDocuments(dateQuery);
    
    // Órdenes por estado
    const ordersByStatus = await Order.aggregate([
      { $match: dateQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Ingresos totales
    const totalRevenue = await Order.aggregate([
      { $match: { ...dateQuery, status: { $nin: ['cancelled'] } } },
      { $group: { _id: null, total: { $sum: '$finalAmount' } } }
    ]);
    
    // Órdenes por día
    const ordersByDay = await Order.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: '$finalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Top servicios
    const topServices = await Order.aggregate([
      { $match: dateQuery },
      { $lookup: { from: 'services', localField: 'service', foreignField: '_id', as: 'serviceInfo' } },
      { $unwind: '$serviceInfo' },
      { $group: { 
        _id: '$service', 
        name: { $first: '$serviceInfo.title' },
        count: { $sum: 1 },
        revenue: { $sum: '$finalAmount' }
      }},
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Top operadores
    const topOperators = await Order.aggregate([
      { $match: { ...dateQuery, operator: { $exists: true }, status: 'completed' } },
      { $lookup: { from: 'users', localField: 'operator', foreignField: '_id', as: 'operatorInfo' } },
      { $unwind: '$operatorInfo' },
      { $group: { 
        _id: '$operator', 
        name: { $first: '$operatorInfo.name' },
        count: { $sum: 1 },
        avgRating: { $avg: '$rating.score' }
      }},
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    return {
      totalOrders,
      ordersByStatus: ordersByStatus.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
      ordersByDay,
      topServices,
      topOperators
    };
  } catch (error) {
    throw new Error(`Error al obtener estadísticas: ${error.message}`);
  }
};

/**
 * @description Find all orders assigned to a specific operator.
 * @param {string} operatorId - The ID of the operator.
 * @returns {Promise<Array>} A promise that resolves to an array of orders.
 */

export const findAssignedOrdersByOperatorId = async (operatorId) => {
    try {
        // Example using Mongoose:
        const orders = await Order.find({
            operator: operatorId, // Assuming 'assignedOperator' field stores the operator's ID
        }).populate('user', 'name email')
          .populate('vehicle address user additionalServices service') // Optionally populate user details
        return orders;

    } catch (error) {
        console.error("Error in findAssignedOrdersByOperatorId service:", error);
        throw new Error('Could not retrieve assigned orders.'); // Re-throw to be caught by controller
    }
};