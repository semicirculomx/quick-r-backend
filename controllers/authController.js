// src/controllers/authController.js
import { register, login, googleSignIn } from '../services/authService.js';

export const registerUser = async (req, res) => {
  try {
    const userData = req.body;
    const result = await register(userData);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const googleAuth = async (req, res) => {
  try {
    const googleData = req.body;
    const result = await googleSignIn(googleData);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};