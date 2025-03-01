// src/services/orderService.js
import Order from '../models/Order.js';
import Service from '../models/Service.js';
import Vehicle from '../models/Vehicle.js';
import { createPaymentIntent } from './paymentService.js';
import { sendNewOrderNotification } from './notificationService.js';

export const createOrder = async (userId, orderData) => {
  try {
    // Verificar que el vehículo existe y pertenece al usuario
    const vehicle = await Vehicle.findOne({ _id: orderData.vehicleId, owner: userId });
    if (!vehicle) {
      throw new Error('Vehículo no encontrado o no autorizado');
    }

    // Obtener servicios solicitados
    const servicesIds = orderData.services.map(s => s.serviceId);
    const services = await Service.find({ _id: { $in: servicesIds } });

    // Calcular precio total basado en el tamaño del vehículo
    let totalAmount = 0;
    const orderServices = services.map(service => {
      const price = service.priceBySize[vehicle.size.toLowerCase()] || service.basePrice;
      totalAmount += price;
      return {
        service: service._id,
        name: service.name,
        category: service.category,
        price
      };
    });

    // Aplicar descuento si es un vehículo nuevo
    const isNewVehicle = orderData.isNewVehicle || false;
    const discount = isNewVehicle ? totalAmount : 0;
    const finalAmount = totalAmount - discount;

    // Aplicar cupón si existe
    let couponDiscount = 0;
    if (orderData.couponCode) {
      // Lógica para validar cupón - esto sería implementado en un servicio aparte
      couponDiscount = 0; // Aquí se calcularía el descuento del cupón
    }

    // Crear la intención de pago con Stripe
    let paymentIntentId = null;
    if (orderData.paymentMethod === 'card' && finalAmount > 0) {
      const paymentIntent = await createPaymentIntent(finalAmount - couponDiscount);
      paymentIntentId = paymentIntent.id;
    }

    // Crear orden
    const order = new Order({
      user: userId,
      vehicle: orderData.vehicleId,
      services: orderServices,
      totalAmount,
      discount,
      couponDiscount,
      finalAmount: finalAmount - couponDiscount,
      paymentMethod: orderData.paymentMethod, // 'card', 'cash'
      paymentStatus: orderData.paymentMethod === 'cash' ? 'pending' : 'awaiting',
      paymentIntentId,
      status: 'created',
      location: orderData.location,
      notes: orderData.notes
    });

    const savedOrder = await order.save();
    
    // Enviar notificación a administradores
    await sendNewOrderNotification(savedOrder._id);

    return {
      order: savedOrder,
      paymentIntentClientSecret: paymentIntentId ? 
        `${paymentIntentId}_secret_${process.env.STRIPE_KEY.substring(0, 8)}` : null
    };
  } catch (error) {
    throw error;
  }
};

export const updateOrderStatus = async (orderId, status, adminId) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status, updatedBy: adminId },
      { new: true }
    );
    
    if (!updatedOrder) {
      throw new Error('Orden no encontrada');
    }
    
    return updatedOrder;
  } catch (error) {
    throw error;
  }
};

export const assignOperator = async (orderId, operatorId, adminId) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { 
        operator: operatorId,
        status: 'assigned',
      },
      { new: true }
    );
    
    if (!updatedOrder) {
      throw new Error('Orden no encontrada');
    }
    
    // Enviar notificación al operador
    // Implementar en notificationService.js
    
    return updatedOrder;
  } catch (error) {
    throw error;
  }
};

export const acceptOrder = async (orderId, operatorId) => {
  try {
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new Error('Orden no encontrada');
    }
    
    if (order.operator.toString() !== operatorId.toString()) {
      throw new Error('No estás asignado a esta orden');
    }
    
    if (order.status !== 'assigned') {
      throw new Error('La orden no está en estado asignado');
    }
    
    order.status = 'in_progress';
    order.startTime = new Date();
    await order.save();
    
    // Notificar al cliente que su servicio ha comenzado
    // Implementar en notificationService.js
    
    return order;
  } catch (error) {
    throw error;
  }
};

export const completeOrder = async (orderId, operatorId) => {
  try {
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new Error('Orden no encontrada');
    }
    
    if (order.operator.toString() !== operatorId.toString()) {
      throw new Error('No estás asignado a esta orden');
    }
    
    if (order.status !== 'in_progress') {
      throw new Error('La orden no está en progreso');
    }
    
    order.status = 'completed';
    order.endTime = new Date();
    await order.save();
    
    // Notificar al cliente que su servicio ha finalizado
    // Implementar en notificationService.js
    
    return order;
  } catch (error) {
    throw error;
  }
};

export const cancelOrder = async (orderId, userId, reason) => {
  try {
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new Error('Orden no encontrada');
    }
    
    // Verificar si el usuario es el dueño de la orden
    if (order.user.toString() !== userId.toString()) {
      throw new Error('No autorizado');
    }
    
    // Verificar si la razón de cancelación es válida
    const validReasons = [
      'operator_not_arrived',
      'service_not_as_described',
      'cancelled_within_5_minutes'
    ];
    
    if (!validReasons.includes(reason)) {
      throw new Error('Razón de cancelación no válida');
    }
    
    // Verificar si la cancelación es dentro de los 5 minutos (sin penalización)
    const cancellationWithinGracePeriod = 
      order.createdAt && 
      (new Date() - new Date(order.createdAt)) / (1000 * 60) <= 5;
    
    const isCancellationViable = 
      reason === 'cancelled_within_5_minutes' && cancellationWithinGracePeriod ||
      reason === 'operator_not_arrived' ||
      reason === 'service_not_as_described';
    
    // Actualizar la orden
    order.status = 'cancelled';
    order.cancellationReason = reason;
    order.cancellationTime = new Date();
    order.refundAmount = isCancellationViable ? order.finalAmount : 0;
    
    await order.save();
    
    // Si hay que procesar reembolso
    if (isCancellationViable && order.paymentMethod === 'card' && order.paymentStatus === 'completed') {
      // Procesar reembolso con Stripe
      // Esto se implementaría en el servicio de pago
    }
    
    return order;
  } catch (error) {
    throw error;
  }
};

export const addServiceToOrder = async (orderId, userId, serviceId) => {
  try {
    // Obtener la orden
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new Error('Orden no encontrada');
    }
    
    // Verificar si el usuario es el dueño de la orden o un administrador
    // Esta verificación se haría en el middleware de autenticación
    
    // Verificar que la orden esté en un estado que permita modificaciones
    if (order.status !== 'created' && order.status !== 'assigned' && order.status !== 'in_progress') {
      throw new Error('No se puede modificar la orden en su estado actual');
    }
    
    // Obtener el servicio a agregar
    const service = await Service.findById(serviceId);
    
    if (!service) {
      throw new Error('Servicio no encontrado');
    }
    
    // Obtener el vehículo para calcular el precio según tamaño
    const vehicle = await Vehicle.findById(order.vehicle);
    
    // Calcular precio del servicio según tamaño del vehículo
    const price = service.priceBySize[vehicle.size.toLowerCase()] || service.basePrice;
    
    // Verificar si ya existe un servicio de la misma categoría en la orden
    const existingServiceSameCategory = order.services.find(s => s.category === service.category);
    
    let additionalPrice = 0;
    
    if (existingServiceSameCategory && service.category === 'Paquetes') {
      // Si es un paquete y ya hay uno, reemplazar y cobrar la diferencia
      const existingPrice = existingServiceSameCategory.price;
      additionalPrice = price > existingPrice ? price - existingPrice : 0;
      
      // Actualizar el servicio existente
      existingServiceSameCategory.service = service._id;
      existingServiceSameCategory.name = service.name;
      existingServiceSameCategory.price = price;
    } else {
      // Agregar nuevo servicio y cobrar el precio completo
      additionalPrice = price;
      order.services.push({
        service: service._id,
        name: service.name,
        category: service.category,
        price
      });
    }
    
    // Actualizar el monto total
    order.totalAmount += additionalPrice;
    order.finalAmount += additionalPrice;
    
    // Si el pago es con tarjeta, crear una nueva intención de pago por la diferencia
    let paymentIntentId = null;
    if (order.paymentMethod === 'card' && additionalPrice > 0) {
      const paymentIntent = await createPaymentIntent(additionalPrice);
      paymentIntentId = paymentIntent.id;
      order.additionalPaymentIntentId = paymentIntentId;
    }
    
    await order.save();
    
    return {
      order,
      additionalPaymentIntentClientSecret: paymentIntentId ? 
        `${paymentIntentId}_secret_${process.env.STRIPE_KEY.substring(0, 8)}` : null
    };
  } catch (error) {
    throw error;
  }
};

export const rateOrder = async (orderId, userId, rating, comment) => {
  try {
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new Error('Orden no encontrada');
    }
    
    // Verificar si el usuario es el dueño de la orden
    if (order.user.toString() !== userId.toString()) {
      throw new Error('No autorizado');
    }
    
    // Verificar que la orden esté completada
    if (order.status !== 'completed') {
      throw new Error('Solo se pueden calificar órdenes completadas');
    }
    
    // Actualizar la calificación
    order.rating = {
      score: rating, // 1-5
      comment,
      date: new Date()
    };
    
    await order.save();
    
    return order;
  } catch (error) {
    throw error;
  }
};

export const getOrdersByUser = async (userId) => {
  try {
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    return orders;
  } catch (error) {
    throw error;
  }
};
