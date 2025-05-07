import {stripe} from ('stripe')(process.env.STRIPE_SECRET_KEY);
import User from ('../models/User');
import {logger} from ('../config/logger'); // Assuming a logger configuration

// Stripe configuration
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY || 'pk_test_51R8cYRB4QzGA4dWXfUgd4vjEawwJ3esB2CPqDS2EpmOixaPvdfMwmtQJhROf35eY3YmLDkufSdMXWn9CG3aU6JYb00OHQ44jo2';

// Show view for adding payment method

// Store client and payment method in Stripe
export const store = async (req, res) => {
    const {
        paymentMethodId,
        name,
        email,
        phone,
        description,
        isDefault,
        user_id
    } = req.body;

    // Validate input
    if (!paymentMethodId || !name || !email) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields'
        });
    }

    try {
        // 1. Create a customer in Stripe
        const customer = await stripe.customers.create({
            name,
            email,
            phone: phone || null,
            description: description || null,
            metadata: {
                client_id: user_id || null,
                source: 'web_application'
            }
        });

        // 2. Attach payment method to customer
        await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customer.id
        });

        // 3. Set as default payment method if specified
        if (isDefault) {
            try {
                await stripe.customers.update(customer.id, {
                    invoice_settings: {
                        default_payment_method: paymentMethodId
                    }
                });
            } catch (error) {
                logger.error('Error setting default payment method:', error.message);
                // Continue despite failure to set default
            }
        }

        // 4. Update client in MongoDB if client_id provided
        if (user_id) {
            const client = await User.findById(user_id);
            if (client) {
                client.stripeCustomerId = customer.id;
                await client.save();
            }
        }

        // 5. Retrieve payment method details
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

        // Return successful response
        return res.json({
            success: true,
            message: 'Client and payment method saved successfully',
            customer,
            paymentMethod
        });

    } catch (error) {
        logger.error('Error in store payment:', error.message);
        return res.status(500).json({
            success: false,
            message: `Error processing request: ${error.message}`
        });
    }
};

// Get payment methods for a customer
export const getPaymentMethods = async (req, res) => {
    const { customerId } = req.params;

    try {
        // Verify customer exists
        const customer = await stripe.customers.retrieve(customerId);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Get payment methods
        const paymentMethods = await stripe.paymentMethods.list({
            customer: customerId,
            type: 'card'
        });

        return res.json({
            success: true,
            data: paymentMethods.data
        });

    } catch (error) {
        logger.error('Error in getPaymentMethods:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Error processing request'
        });
    }
};