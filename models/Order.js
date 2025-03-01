// models/ServiceOrder.js - Modelo para órdenes de servicio
import mongoose from'mongoose';

const serviceOrderSchema = new mongoose.Schema({
  services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Servicio' }],
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  operator: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  status: { 
    type: String, 
    enum: ['solicited', 'assigned', 'in_process', 'finalized', 'cancelled'],
    default: 'solicited'
  },
  scheduledDate: { type: Date, required: true },
  location: { type: mongoose.Schema.Types.ObjectId, ref: 'Direccion' },
  specialInstructions: { type: String },
  // Información de precios
  basePrice: { type: Number, required: true }, // Precio base del servicio al momento de la orden
  additionalCharges: [{
    description: { type: String },
    amount: { type: Number }
  }],
  discount: { type: Number, default: 0 },
  finalPrice: { type: Number }, // Precio final calculado
  // Seguimiento de tiempos
  requestedAt: { type: Date, default: Date.now },
  assignedAt: { type: Date },
  startedAt: { type: Date },
  completedAt: { type: Date },
  cancelledAt: { type: Date },
  // Información de pago
  payment: {
    status: { 
      type: String, 
      enum: ['pendiente', 'pre_autorizado', 'pagado', 'reembolsado', 'fallido'],
      default: 'pendiente'
    },
    method: { 
      type: String, 
      enum: ['tarjeta', 'paypal', 'transferencia', 'efectivo']
    },
    paidAt: { type: Date },
    servicePhotos: [{
        before: String, // URL de la imagen antes del servicio
        after: String,  // URL de la imagen después del servicio
        description: String
      }],
  },
  // Calificación y reseña
//   rating: {
//     score: { type: Number, min: 1, max: 5 },
//     comment: { type: String },
//     metrics: {
//       puntualidad: { type: Number, min: 1, max: 5 },
//       calidad: { type: Number, min: 1, max: 5 },
//       comunicacion: { type: Number, min: 1, max: 5 },
//       precioCalidad: { type: Number, min: 1, max: 5 }
//     },
//     ratedAt: { type: Date }
//   },
  // Operador de historial para cambios de estado
//   statusHistory: [{
//     status: { type: String },
//     timestamp: { type: Date, default: Date.now },
//     notes: { type: String }
//   }]
});

const ServiceOrder = mongoose.model('ServiceOrder', serviceOrderSchema);
export default ServiceOrder;