import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const serviceSchema = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subcategory: { type: String, required: false, trim: true },
  price: { type: Number, required: true },
  duration: { type: Number, required: true }, // Duración estimada en minutos
  images: [{ type: String }], // URLs de imágenes
  isActive: { type: Boolean, default: true },
  tags: [{ type: String, trim: true }], // Etiquetas para búsqueda
  createdAt: { type: Date, default: Date.now },
});

const Servicio = mongoose.model('Service', serviceSchema);
export default Servicio;
