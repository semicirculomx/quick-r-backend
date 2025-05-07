import express from 'express';
import createCheckoutSession from '../controllers/payments/checkoutStripe.js'
import passport from '../middlewares/passport.js';
import User from '../models/User.js';
import stripe from 'stripe'
const router = express.Router();
const stripeSecretKey = 'sk_test_51R8cYRB4QzGA4dWXBAQy2jgHo0PWKUMEP7j8hhwOhOaRk3Faw0AMbZWhgNhY5nuKOURK7q2vhNboXmj5aB8Y3OVS00SpyONtgZ';
const stripeClient = new stripe(stripeSecretKey);

router.post('/', passport.authenticate('jwt', { session: false }), createCheckoutSession)
// Create Setup Intent endpoint
router.post('/create-setup-intent', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const userId = req.user._id; // From authentication middleware
    const user = await User.findById(userId);

    // Check for existing customer
    if (!user.stripeCustomerId) {
      const customer = await stripeClient.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user._id.toString() }
      });
      user.stripeCustomerId = customer.id;
      await user.save();
    }

    // Create ephemeral key for existing customer
    const ephemeralKey = await stripeClient.ephemeralKeys.create(
      { customer: user.stripeCustomerId },
      { apiVersion: '2023-08-16' }
    );

    // Create setup intent
    const setupIntent = await stripeClient.setupIntents.create({
      customer: user.stripeCustomerId,
      payment_method_types: ['card'],
      usage: 'off_session',
    });

    res.json({
      customer: user.stripeCustomerId,
      ephemeralKey: ephemeralKey.secret,
      setupIntent: setupIntent.client_secret,
      publishableKey: 'pk_test_51R8cYRB4QzGA4dWXfUgd4vjEawwJ3esB2CPqDS2EpmOixaPvdfMwmtQJhROf35eY3YmLDkufSdMXWn9CG3aU6JYb00OHQ44jo2',
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Payment Methods endpoint
router.get('/methods', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const user = req.user;

  if (!req.user.stripeCustomerId) {
    return res.status(200).json({ paymentMethods: [] });
  }

  const paymentMethods = await stripeClient.paymentMethods.list({
    customer: req.user.stripeCustomerId,
    type: 'card',
  });


  if (!req.user.customerProfile.defaultPaymentMethodId && paymentMethods.data.length > 0) {
    user.customerProfile.defaultPaymentMethodId = paymentMethods.data[0].id;
    await user.save();
  }


  res.json({
    paymentMethods: paymentMethods.data.map(pm => ({
      id: pm.id,
      brand: pm.card.brand,
      last4: pm.card.last4,
      expMonth: pm.card.exp_month,
      expYear: pm.card.exp_year,
      isDefault: pm.id === req.user.customerProfile.defaultPaymentMethodId
    }))
  });
});

router.put(
  '/methods/:id/default',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const user = req.user;
      const paymentMethodId = req.params.id;

      // Verificar si el usuario tiene customer en Stripe
      if (!user.stripeCustomerId) {
        return res.status(400).json({ error: 'Customer no existe en Stripe' });
      }

      // Verificar que el payment method pertenece al customer
      const paymentMethod = await stripeClient.customers.retrievePaymentMethod(
        user.stripeCustomerId,
        paymentMethodId
      );

      if (!paymentMethod) {
        return res.status(404).json({ error: 'Método de pago no encontrado' });
      }

      // Actualizar en el usuario
      user.customerProfile.defaultPaymentMethodId = paymentMethodId;
      await user.save();

      res.json({
        success: true,
        message: 'Método de pago predeterminado actualizado',
        defaultPaymentMethod: {
          id: paymentMethodId,
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          expMonth: paymentMethod.card.exp_month,
          expYear: paymentMethod.card.exp_year
        }
      });

    } catch (error) {
      console.error('Error setting default payment method:', error);

      let statusCode = 500;
      let message = 'Error al actualizar método predeterminado';

      if (error.type === 'StripeInvalidRequestError') {
        statusCode = 400;
        message = error.message;
      }

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }
);

export default router