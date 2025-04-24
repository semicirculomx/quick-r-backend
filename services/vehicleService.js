// src/services/vehicleService.js
import Vehicle from '../models/Vehicle.js';
import User from '../models/User.js';

export const addVehicle = async (userId, vehicleData) => {
  try {
    // Verificar si ya existe un vehículo con esa placa
    const existingVehicle = await Vehicle.findOne({ plate: vehicleData.plate });
    if (existingVehicle) {
      throw new Error('Ya existe un vehículo con esa placa');
    }

    // Crear nuevo vehículo
    const vehicle = new Vehicle({
      owner: userId,
      plate: vehicleData.licensePlate,
      size: vehicleData.size,  // pequeño, mediano, grande
    });

    const savedVehicle = await vehicle.save();

    // Añadir el vehículo al usuario
    await User.findByIdAndUpdate(
      userId,
      { $push: { vehicles: savedVehicle._id } }
    );

    return savedVehicle;
  } catch (error) {
    throw error;
  }
};


/**
 * Establecer una dirección como predeterminada
 */
export const setDefaultVehicle = async (vehicleId, userId) => {
  try {
    // Verificar que la dirección pertenece al usuario
    const vehicle = await Vehicle.findOne({ _id: vehicleId, owner: userId });
    
    if (!vehicle) {
      throw new Error('Dirección no encontrada o no autorizada');
    }
    
    // Quitar estado predeterminado de todas las direcciones del usuario
    await Vehicle.updateMany(
      { owner: userId },
      { isDefault: false }
    );
    
    // Establecer esta dirección como predeterminada
    vehicle.isDefault = true;
    await vehicle.save();
    
    return vehicle;
  } catch (error) {
    throw error;
  }
};


export const getUserVehicles = async (userId) => {
  try {
    const vehicles = await Vehicle.find({ owner: userId });
    return vehicles;
  } catch (error) {
    throw error;
  }
};

export const deleteVehicle = async (userId, vehicleId) => {
  try {
    // Verificar que el vehículo pertenece al usuario
    const vehicle = await Vehicle.findOne({ _id: vehicleId, owner: userId });
    if (!vehicle) {
      throw new Error('Vehículo no encontrado o no autorizado');
    }

    // Eliminar vehículo
    await Vehicle.findByIdAndDelete(vehicleId);

    // Remover el vehículo del usuario
    await User.findByIdAndUpdate(
      userId,
      { $pull: { vehicles: vehicleId } }
    );

    return { message: 'Vehículo eliminado correctamente' };
  } catch (error) {
    throw error;
  }
};

export const updateVehicle = async (userId, vehicleId, updateData) => {
    try {
      // Verificar que el vehículo pertenece al usuario
      const vehicle = await Vehicle.findOne({ _id: vehicleId, owner: userId });
      if (!vehicle) {
        throw new Error('Vehículo no encontrado o no autorizado');
      }
  
      // Actualizar vehículo
      const updatedVehicle = await Vehicle.findByIdAndUpdate(
        vehicleId,
        { ...updateData },
        { new: true }
      );
  
      return updatedVehicle;
    } catch (error) {
      throw error;
    }
  };
