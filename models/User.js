import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const userSchema = new Schema({
  // Datos básicos del usuario
  name: { 
    type: String, 
    required: false,
    default: null
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: {
    type: String,
    required: function () {
      // Contraseña requerida solo si no hay googleId
      return !this.googleId;
    }
  },
  phone: { 
    type: String, 
    required: false 
  },
  
  // Autenticación y permisos
  googleId: {
    type: String
  },
  role: {
    type: String,
    enum: ['client', 'operator', 'admin'],
    default: 'client'
  },
  is_online: { 
    type: Boolean, 
    required: true 
  },
  is_verified: { 
    type: Boolean, 
    required: false 
  },
  verify_code: { 
    type: Number, 
    required: false 
  },
  stripeCustomerId: {
    type: String
  },
  // Perfil y preferencias
  profilePicture: {
    type: String
  },
  pushToken: {
    type: String
  },
  // Campos específicos para clientes
  customerProfile: {
    defaultPaymentMethodId: {
      type: String,
    }
  },
  
  // Campos específicos para operadores
  operatorProfile: {
    isActive: {
      type: Boolean,
      default: false
    },
    // Estadísticas y métricas
    metrics: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    // Categorías en las que puede trabajar
    serviceCategories: [{
      category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }
    }],
    // Estado actual del operador
    currentStatus: {
      status: { type: String, enum: ['available', 'assigned', 'on_service', 'off'], default: 'off' },
      currentServiceOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    },
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
}, { timestamps: true });

// Método para verificar si un usuario es operador
userSchema.methods.isOperator = function () {
  return this.role === 'operator';
};

// Método para verificar si un usuario es administrador
userSchema.methods.isAdmin = function () {
  return this.role === 'admin';
};

// Método para actualizar el estado de disponibilidad del operador
userSchema.methods.updateOperatorAvailability = async function (status) {
  if (this.role !== 'operator') {
    throw new Error('Solo los operadores pueden actualizar su disponibilidad');
  }

  this.operatorProfile.currentStatus.status = status;
  return this.save();
};

// Método para actualizar el rating del operador
userSchema.methods.updateOperatorRating = async function (newRating) {
  if (this.role !== 'operator') {
    throw new Error('Solo los operadores pueden recibir calificaciones');
  }

  const currentAvg = this.operatorProfile.metrics.average;
  const currentCount = this.operatorProfile.metrics.count;

  // Calcular nuevo promedio
  const newAverage = ((currentAvg * currentCount) + newRating) / (currentCount + 1);

  this.operatorProfile.metrics.average = newAverage;
  this.operatorProfile.metrics.count += 1;

  return this.save();
};

const User = mongoose.model('User', userSchema);
export default User;