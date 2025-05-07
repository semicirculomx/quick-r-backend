import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const PaymentMethodSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
    },
    provider: {
      type: String,
      enum: ['stripe', 'mercado_pago'], // Puedes agregar más si usas otros
      required: true,
    },
    stripePaymentMethodId: {
      type: String,
      required: true, // Ej: 'pm_1NpWGT2eZvKYlo2C0aS0twCf'
    },
    brand: String,      // Ej: 'Visa'
    last4: String,      // Ej: '4242'
    expMonth: Number,  // Ej: 12
    expYear: Number,   // Ej: 2026
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const PaymentMethod = model('PaymentMethod', PaymentMethodSchema);