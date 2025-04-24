// src/controllers/vehicleController.js
import * as vehicleService from '../services/vehicleService.js';

export const createVehicle = async (req, res) => {
  try {
    const userId = req.user.id; // Asumiendo que el middleware de autenticación añade el usuario
    const vehicleData = req.body;
    const vehicle = await vehicleService.addVehicle(userId, vehicleData);
    res.status(201).json({data: vehicle, success: true});
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getVehicles = async (req, res) => {
  try {
    const userId = req.user.id;
    const vehicles = await vehicleService.getUserVehicles(userId);
    res.status(200).json({
      data:vehicles, 
      success: true
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const removeVehicle = async (req, res) => {
  try {
    const userId = req.user.id;
    const vehicleId = req.params.id;
    const result = await vehicleService.deleteVehicle(userId, vehicleId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Establecer una dirección como predeterminada
 */
export const setDefaultVehicle = async (req, res) => {

    console.log('setDefaultVehicle');
  try {
    const userId = req.user.id;
    const vehicleId = req.params.vehicleId;
    const vehicle = await vehicleService.setDefaultVehicle(vehicleId, userId);
    
    res.status(200).json({ 
      success: true,
      data: vehicle
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};