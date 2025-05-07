import mongoose from 'mongoose';
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import Cart from '../../models/Cart.js';
import User from '../../models/User.js';
import { handleCouponUsage } from '../../utils/couponUtils.js';
import { validateCartProducts } from '../../utils/productUtils.js';
import { clearCart } from '../../utils/clearCart.util.js';
import sendEmail from '../../utils/mailing.util.js';

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

const createOrder = async (req, res) => {
    const { serviceId, vehicleId, addressId, paymentMethod, couponId = null } = req.body;
    const userId = req.user._id.toString();

    let updatedProducts = []; // Track updated products for rollback

    try {
        const cart = await Cart.findById(cartId);
        if (!cart) {
            throw new Error('Carrito no encontrado');
        }

        const { validatedProducts, totalPrice: initialTotalPrice } = await validateCartProducts(cart.products);

        let totalPrice = initialTotalPrice;

        let coupon = null;
        if (couponId) {
            coupon = await handleCouponUsage(couponId, userId);

            if (coupon.discountPercentage && coupon.discountPercentage > 0) {
                totalPrice -= totalPrice * (coupon.discountPercentage / 100);
            } else if (coupon.discountAmount && coupon.discountAmount > 0) {
                totalPrice -= coupon.discountAmount;
            }

            if (totalPrice < 0) totalPrice = 0;
        }

        // Update stock and track changes
        for (const product of validatedProducts) {
            const updatedProduct = await Product.findByIdAndUpdate(
                product.product,
                { $inc: { stock: -product.quantity } },
                { new: true }
            );

            if (!updatedProduct) {
                throw new Error(`Producto no encontrado: ${product.name}`);
            }

            if (updatedProduct.stock < 0) {
                throw new Error(`Stock insuficiente para el producto: ${product.name}, elimina del carrito el producto`);
            }

            updatedProducts.push({ productId: product.product, quantity: product.quantity });
        }

        // Create the order
        const newOrder = new Order({
            user: userId,
            products: validatedProducts,
            totalPrice,
            deliveryAddress,
            paymentMethod,
            coupon: coupon ? {
                code: coupon.code,
                discountPercentage: coupon.discountPercentage,
                discountAmount: coupon.discountAmount
            } : null,
            nota
        });

        await newOrder.save();

        // Clear the cart
        await clearCart(userId);

        // Send push notification to the user
        const user = await User.findById(userId);
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
                `Tu orden con un total de $${totalPrice.toFixed(2)} ha sido confirmada y está en proceso.`,
                { orderId: newOrder._id }
            );
        }

        }

        return res.status(201).json({ success: true, order: newOrder });
    } catch (error) {
        console.error(error);

        // Rollback stock changes
        for (const { productId, quantity } of updatedProducts) {
            await Product.findByIdAndUpdate(productId, { $inc: { stock: quantity } });
        }

        return res.status(500).json({ success: false, message: 'Ocurrió un error al crear la orden, por favor intente de nuevo' });
    }
};

export default createOrder;