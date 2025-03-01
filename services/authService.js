// src/services/authService.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { sendRegistrationEmail } from './notificationService.js';

export const register = async (userData) => {
  try {
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error('El correo ya está registrado');
    }

    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    // Crear nuevo usuario
    const user = new User({
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: userData.role || 'cliente', // Por defecto es cliente
      vehicles: [] // Inicialmente sin vehículos
    });

    const savedUser = await user.save();
    
    // Enviar email de bienvenida
    await sendRegistrationEmail(savedUser.email, savedUser.name);

    // Generar token JWT
    const token = jwt.sign(
      { id: savedUser._id, role: savedUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role
      }
    };
  } catch (error) {
    throw error;
  }
};

export const login = async (email, password) => {
  try {
    // Buscar usuario
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Credenciales inválidas');
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  } catch (error) {
    throw error;
  }
};

export const googleSignIn = async (googleData) => {
  try {
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email: googleData.email });

    if (existingUser) {
      // Usuario ya existe, generar token
      const token = jwt.sign(
        { id: existingUser._id, role: existingUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        token,
        user: {
          id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role
        }
      };
    } else {
      // Crear nuevo usuario
      const user = new User({
        name: googleData.name,
        email: googleData.email,
        googleId: googleData.googleId,
        role: 'cliente',
        vehicles: []
      });

      const savedUser = await user.save();
      
      // Enviar email de bienvenida
      await sendRegistrationEmail(savedUser.email, savedUser.name);

      // Generar token JWT
      const token = jwt.sign(
        { id: savedUser._id, role: savedUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        token,
        user: {
          id: savedUser._id,
          name: savedUser.name,
          email: savedUser.email,
          role: savedUser.role
        }
      };
    }
  } catch (error) {
    throw error;
  }
};