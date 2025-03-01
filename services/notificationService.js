// src/services/notificationService.js
import nodemailer from 'nodemailer';
import { Expo } from 'expo-server-sdk';
import User from '../models/User.js';
import Order from '../models/Order.js';

// Configurar transporter para enviar correos
const transporter = nodemailer.createTransport({
  // Configuración para MailerSend o cualquier otro servicio de email
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Inicializar Expo para push notifications
const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

export const sendRegistrationEmail = async (email, name) => {
  try {
    const mailOptions = {
      from: `"Mi Aplicación" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: '¡Bienvenido a nuestra aplicación!',
      html: `
        <div>
          <h2>¡Hola ${name}!</h2>
          <p>Gracias por registrarte en nuestra aplicación de servicio de lavado de autos.</p>
          <p>Ahora puedes comenzar a usar nuestros servicios.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error enviando email:', error);
    return false;
  }
};

export const sendNewOrderNotification = async (orderId) => {
  try {
    // Obtener detalles de la orden
    const order = await Order.findById(orderId)
      .populate('user', 'name email')
      .populate('vehicle')
      .exec();

    if (!order) {
      throw new Error('Orden no encontrada');
    }

    // Obtener administradores para notificar
    const admins = await User.find({ role: 'admin' });

    // Enviar email a cada administrador
    for (const admin of admins) {
      const mailOptions = {
        from: `"Mi Aplicación" <${process.env.EMAIL_FROM}>`,
        to: admin.email,
        subject: `Nueva orden de servicio #${order._id}`,
        html: `
          <div>
            <h2>Nueva orden de servicio</h2>
            <p>Cliente: ${order.user.name}</p>
            <p>Vehículo: ${order.vehicle.make} ${order.vehicle.model} (${order.vehicle.plate})</p>
            <p>Total: $${order.finalAmount}</p>
            <p>Accede al dashboard para más detalles.</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);

      // Enviar push notification si el admin tiene token
      if (admin.pushToken && Expo.isExpoPushToken(admin.pushToken)) {
        const message = {
          to: admin.pushToken,
          sound: 'default',
          title: 'Nueva orden de servicio',
          body: `${order.user.name} ha solicitado un servicio.`,
          data: { orderId: order._id.toString() }
        };

        const chunks = expo.chunkPushNotifications([message]);
        for (const chunk of chunks) {
          await expo.sendPushNotificationsAsync(chunk);
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error enviando notificación:', error);
    return false;
  }
};

export const sendOrderStatusUpdate = async (orderId, status) => {
  try {
    // Obtener detalles de la orden
    const order = await Order.findById(orderId)
      .populate('user', 'name email pushToken')
      .exec();

    if (!order) {
      throw new Error('Orden no encontrada');
    }

    // Preparar mensaje según el estado
    let subject, body, title;
    switch (status) {
      case 'assigned':
        subject = `Tu orden #${orderId} ha sido asignada`;
        title = 'Orden asignada';
        body = 'Un operador ha sido asignado a tu servicio.';
        break;
      case 'in_progress':
        subject = `Tu orden #${orderId} está en progreso`;
        title = 'Servicio iniciado';
        body = 'El operador ha comenzado a trabajar en tu servicio.';
        break;
      case 'completed':
        subject = `Tu orden #${orderId} ha sido completada`;
        title = 'Servicio completado';
        body = 'Tu servicio ha sido completado. ¡Gracias por tu confianza!';
        break;
      case 'cancelled':
        subject = `Tu orden #${orderId} ha sido cancelada`;
        title = 'Orden cancelada';
        body = 'Tu orden ha sido cancelada. Contacta a soporte si necesitas ayuda.';
        break;
      default:
        subject = `Actualización de tu orden #${orderId}`;
        title = 'Actualización de orden';
        body = `El estado de tu orden ha cambiado a: ${status}`;
    }

    // Enviar email al cliente
    const mailOptions = {
      from: `"Mi Aplicación" <${process.env.EMAIL_FROM}>`,
      to: order.user.email,
      subject,
      html: `
        <div>
          <h2>${title}</h2>
          <p>${body}</p>
          <p>Gracias por usar nuestro servicio.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    // Enviar push notification si el cliente tiene token
    if (order.user.pushToken && Expo.isExpoPushToken(order.user.pushToken)) {
      const message = {
        to: order.user.pushToken,
        sound: 'default',
        title,
        body,
        data: { orderId: order._id.toString() }
      };

      const chunks = expo.chunkPushNotifications([message]);
      for (const chunk of chunks) {
        await expo.sendPushNotificationsAsync(chunk);
      }
    }

    return true;
  } catch (error) {
    console.error('Error enviando notificación:', error);
    return false;
  }
};
