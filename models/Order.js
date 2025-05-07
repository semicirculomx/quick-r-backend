import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const OrderSchema = new Schema({
  user: { type: Types.ObjectId, ref: 'User', required: true },
  service: { type: Types.ObjectId, ref: 'Service', required: true },
  vehicle: { type: Types.ObjectId, ref: 'Vehicle', required: true },
  address: { type: Types.ObjectId, ref: 'Address', required: true },
  scheduled: { type: Date, required: false },
  totalAmount: { type: Number, required: true },
  coupon: {
    code: { type: String },
    discountPercentage: { type: Number },
    discountAmount: { type: Number }
  },
  finalAmount: { type: Number, required: true },
  paymentMethodId: { type: String },
  paymentStatus: {
    type: String,
    enum: ['processing', 'requires_action', 'requires_capture', 'requires_confirmation', 'requires_payment_method', 'succeeded', 'canceled'],
    default: null
  },
  paymentIntentId: { type: String },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  operator: { type: Types.ObjectId, ref: 'User' },
  notes: { type: String },
  additionalServices: [{ type: Types.ObjectId, ref: 'Service' }],
  rating: {
    score: { type: Number, min: 1, max: 5 },
    comment: { type: String }
  },
  confirmedAt: { type: Date },
  assignedAt: { type: Date },
  startTime: { type: Date },
  finishedAt: { type: Date },
  cancellationTime: { type: Date },
  cancelReason: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Automatically update `updatedAt` field
OrderSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default model('Order', OrderSchema);