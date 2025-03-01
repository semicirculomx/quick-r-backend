import mongoose from 'mongoose';
const { Schema } = mongoose;

const addressSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
  },
  street: {
    type: String,
  },
  number: {
    type: String,
  },
  city: {
    type: String,
  },
  state: {
    type: String,
  },
  zipCode: {
    type: String,
  },
  references: String,
  coordinates: {
    lat: Number,
    lng: Number
  },
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

const Direccion = mongoose.model('Address', addressSchema);
export default Direccion;
