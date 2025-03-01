import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const servicioSchema = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria', required: true },
  subcategory: { type: String, required: false, trim: true },
  price: { type: Number, required: true },
  duration: { type: Number, required: true }, // Duración estimada en minutos
  images: [{ type: String }], // URLs de imágenes
  isActive: { type: Boolean, default: true },
  tags: [{ type: String, trim: true }], // Etiquetas para búsqueda
  createdAt: { type: Date, default: Date.now },
});

const Servicio = mongoose.model('Servicio', servicioSchema);
export default Servicio;
