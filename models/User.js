import mongoose from 'mongoose';

const { Schema } = mongoose;

const UsuarioSchema = new Schema({
  name: {
    type: String,
    required: true
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
  googleId: {
    type: String
  },
  role: {
    type: String,
    enum: ['cliente', 'operador', 'admin'],
    default: 'cliente'
  },
  phone: {
    type: String
  },
  profilePicture: {
    type: String
  },
  pushToken: {
    type: String
  },
  // Campos específicos para clientes
  customerProfile: {
    preferredPaymentMethod: {
      type: String,
      enum: ['card', 'cash'],
      default: 'card'
    },
    savedCards: [{
      isDefault: { type: Boolean, default: false },
      last4: String,
      brand: String,
      stripeCardId: String,
      paymentToken: { type: String } // Token generado por el servicio de pagos
    }]
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
    // Categorías en las que puede trabajar (en lugar de servicios específicos)
    serviceCategories: [{
      category: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria' }
    }],
    // Estado actual del operador
    currentStatus: {
      status: { type: String, enum: ['available', 'assigned', 'on_service', 'off'], default: 'off' },
      currentServiceOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceOrder' },
    },
  },
  verificationToken: String,
  verificationTokenExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  isVerified: { type: Boolean, default: false },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
}, { timestamps: true });

// Método para verificar si un usuario es operador
UsuarioSchema.methods.isOperator = function () {
  return this.role === 'operador';
};

// Método para verificar si un usuario es administrador
UsuarioSchema.methods.isAdmin = function () {
  return this.role === 'admin';
};

// Método para actualizar el estado de disponibilidad del operador
UsuarioSchema.methods.updateOperatorAvailability = async function (status) {
  if (this.role !== 'operador') {
    throw new Error('Solo los operadores pueden actualizar su disponibilidad');
  }

  this.operatorProfile.currentStatus.status = status;
  return this.save();
};

// Método para actualizar el rating del operador
UsuarioSchema.methods.updateOperatorRating = async function (newRating) {
  if (this.role !== 'operador') {
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

const Usuario = mongoose.model('Usuario', UsuarioSchema);
export default Usuario;