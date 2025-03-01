// src/controllers/vehicleController.js
import { addVehicle, getUserVehicles, deleteVehicle } from '../services/vehicleService.js';

export const createVehicle = async (req, res) => {
  try {
    const userId = req.user.id; // Asumiendo que el middleware de autenticación añade el usuario
    const vehicleData = req.body;
    const vehicle = await addVehicle(userId, vehicleData);
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getVehicles = async (req, res) => {
  try {
    const userId = req.user.id;
    const vehicles = await getUserVehicles(userId);
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const removeVehicle = async (req, res) => {
  try {
    const userId = req.user.id;
    const vehicleId = req.params.id;
    const result = await deleteVehicle(userId, vehicleId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};