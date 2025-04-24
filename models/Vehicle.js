import mongoose from 'mongoose';
const { Schema } = mongoose;

const vehicleSchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plate: {
    type: String,
    required: [true, 'La placa es obligatoria'],
    uppercase: true,
    trim: true
  },
  size: {
    type: String,
    enum: ['small', 'medium', 'big', 'other'],
    required: [true, 'El tamaño del vehículo es obligatorio']
  },
  brand: String,
  model: String,
  year: Number,
  color: String,
  isDefault: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
export default Vehicle;
