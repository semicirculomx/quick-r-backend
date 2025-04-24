import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const serviceSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  price: { type: Number, required: true },
  duration: { type: Number, required: false }, // Duración estimada en minutos
  images: [{ type: String }], // URLs de imágenes
  isActive: { type: Boolean, default: true },
  rating: { type: Number}, // Calificación promedio
  tags: [{ type: String, trim: true }], // Etiquetas para búsqueda
  createdAt: { type: Date, default: Date.now },
});

const Servicio = mongoose.model('Service', serviceSchema);
export default Servicio;
