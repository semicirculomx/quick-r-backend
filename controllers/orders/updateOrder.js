import Order from '../../models/Order.js';
import User from '../../models/User.js';

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

const updateOrder = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
        }

        // Actualizar estado
        if (status) order.status = status;

        await order.save();

        // Send push notification when the status is updated
        const user = await User.findById(order.user);
        if (user && user.pushToken) {
            const statusMessages = {
                "pendiente": 'Tu pedido está pendiente.',
                "en preparación": 'Estamos procesando tu pedido.',
                "en camino": 'Tu pedido está en camino.',
                "cancelado": 'Tu pedido ha sido cancelado.',
                "entregado": 'Tu pedido ha sido entregado.',
            };

            const notificationBody = statusMessages[status] || 'El estado de tu pedido ha cambiado.';
            await sendPushNotification(
                user.pushToken,
                'Actualización de tu pedido',
                notificationBody,
                { orderId: order._id, newStatus: status }
            );
        }

        return res.status(200).json({ success: true, order });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error interno en el servidor' });
    }
};

export default updateOrder;