// models/Review.js
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
  serviceOrder: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ServiceOrder', 
    required: true 
  },
  reviewer: {
    type: { type: String, enum: ['client', 'operator'], required: true },
    id: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'reviewer.type' }
  },
  reviewee: {
    type: { type: String, enum: ['client', 'operator', 'service'], required: true },
    id: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'reviewee.type' }
  },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  
  // Métricas específicas
  metrics: {
    puntualidad: { type: Number, min: 1, max: 5 },
    calidad: { type: Number, min: 1, max: 5 },
    comunicacion: { type: Number, min: 1, max: 5 },
    precioCalidad: { type: Number, min: 1, max: 5 }
  },
  
  // Moderación
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  moderationNotes: { type: String },
  
  // Respuesta a la reseña
  response: {
    comment: { type: String },
    createdAt: { type: Date }
  },
  
  // Reportes
  reports: [{
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String },
    status: { type: String, enum: ['pending', 'reviewed', 'dismissed'] },
    createdAt: { type: Date, default: Date.now }
  }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
export default mongoose.model('Review', reviewSchema);
