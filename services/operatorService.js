// src/services/operatorService.js
import User from '../models/User.js';
// Registrar un nuevo operador (sólo admins pueden hacerlo)
export const registerOperator = async (userData) => {
  try {
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error('El correo ya está registrado');
    }

    // Crear nuevo usuario con rol de operador
    const user = new User({
      name: userData.name,
      email: userData.email,
      password: userData.password, // Se encriptará en el servicio de autenticación
      role: 'operador',
      phone: userData.phone,
      operatorProfile: {
        isActive: false, // Por defecto inactivo hasta que un admin lo active
      }
    });

    const savedUser = await user.save();
    
    // Notificar al operador que su cuenta ha sido creada
    // Esto se implementaría en notificationService.js
    
    return {
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        operatorProfile: savedUser.operatorProfile
      }
    };
  } catch (error) {
    throw error;
  }
};

// Obtener todos los operadores (para administradores)
export const getAllOperators = async () => {
  try {
    const operators = await User.find({ role: 'operador' }).select('-password');
    return operators;
  } catch (error) {
    throw error;
  }
};

// Obtener operadores disponibles
export const getAvailableOperators = async () => {
  try {
    const operators = await User.find({
      role: 'operador',
      isActive: true,
      'operatorProfile.isActive': true,
      'operatorProfile.availability': 'available'
    }).select('-password');
    
    return operators;
  } catch (error) {
    throw error;
  }
};

// Actualizar estado de operador
export const updateOperatorStatus = async (operatorId, status) => {
  try {
    const operator = await User.findOne({ _id: operatorId, role: 'operador' });
    
    if (!operator) {
      throw new Error('Operador no encontrado');
    }
    
    operator.operatorProfile.availability = status;
    
    await operator.save();
    return operator;
  } catch (error) {
    throw error;
  }
};

// Cuando un operador completa una orden, actualizamos su estado a disponible
export const completeOrderAndUpdateOperator = async (orderId, operatorId) => {
    try {
      const result = await completeOrder(orderId, operatorId);
      await updateOperatorStatus(operatorId, 'available');
      return result;
    } catch (error) {
      throw error;
    }
  };
