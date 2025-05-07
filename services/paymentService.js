// src/services/paymentService.js
import Stripe from 'stripe';
import Order from '../models/Order';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = async (order) => {
  try {
    // Convertir a centavos para Stripe
    const { amount } = order;
    const amountInCents = Math.round(amount * 100);
    
    console.log('Creating payment intent with amount:', order);
    // const paymentIntent = await stripe.paymentIntents.create({
    //   ...order,
    //   amount: amountInCents,
    //   currency: 'mxn',
    //   payment_method_types: ['card'],
    // });
    
    return paymentIntent;
  } catch (error) {
    throw error;
  }
};

export const confirmPayment = async (orderId, paymentIntentId) => {
  try {
    // Buscar la orden
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new Error('Orden no encontrada');
    }
    
    // Verificar que el paymentIntentId corresponde a esta orden
    if (order.paymentIntentId !== paymentIntentId && order.additionalPaymentIntentId !== paymentIntentId) {
      throw new Error('ID de pago inválido');
    }
    
    // Verificar el estado del pago con Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      // Determinar si es el pago principal o adicional
      if (order.paymentIntentId === paymentIntentId) {
        order.paymentStatus = 'completed';
        order.status = 'requested'; // Actualizar estado de la orden
      } else if (order.additionalPaymentIntentId === paymentIntentId) {
        order.additionalPaymentStatus = 'completed';
      }
      
      await order.save();
      
      return { success: true, order };
    } else {
      return { success: false, status: paymentIntent.status };
    }
  } catch (error) {
    throw error;
  }
};

export const processRefund = async (orderId) => {
  try {
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new Error('Orden no encontrada');
    }
    
    if (order.paymentStatus !== 'completed' || !order.paymentIntentId) {
      throw new Error('No hay pago para reembolsar');
    }
    
    // Crear reembolso en Stripe
    const refund = await stripe.refunds.create({
      payment_intent: order.paymentIntentId,
      amount: Math.round(order.refundAmount * 100), // Convertir a centavos
    });
    
    // Actualizar orden
    order.refundId = refund.id;
    order.refundStatus = 'processed';
    await order.save();
    
    return { success: true, refund };
  } catch (error) {
    throw error;
  }
};