 // models/Category.js
import mongoose from 'mongoose';

const categoriaSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  icon: { type: String }, // URL o nombre del icono
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Categoria = mongoose.model('Categoria', categoriaSchema);
export default Categoria;
