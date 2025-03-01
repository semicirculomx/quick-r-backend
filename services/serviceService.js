// src/services/serviceService.js
import Service from '../models/Service.js';

export const createService = async (serviceData) => {
  try {
    // Crear nuevo servicio en catálogo
    const service = new Service({
      name: serviceData.name,
      description: serviceData.description,
      category: serviceData.category, // 'Paquetes', 'Detailing', 'Individuales'
      price: serviceData.price,
      subcategory: serviceData.subcategory,
      // Precios según tamaño del vehículo
      // priceBySize: {
      //   small: serviceData.priceBySize?.small || serviceData.basePrice,
      //   medium: serviceData.priceBySize?.medium || serviceData.basePrice * 1.2,
      //   large: serviceData.priceBySize?.large || serviceData.basePrice * 1.5
      // },
      // active: true
    });

    const savedService = await service.save();
    return savedService;
  } catch (error) {
    throw error;
  }
};

export const getAllServices = async () => {
    try {
      const services = await Service.find({ active: true });
      return services;
    } catch (error) {
      throw error;
    }
  };
  
  export const getServicesByCategory = async (category) => {
    try {
      const services = await Service.find({ category, active: true });
      return services;
    } catch (error) {
      throw error;
    }
  };
  
  export const updateService = async (serviceId, updateData) => {
    try {
      const updatedService = await Service.findByIdAndUpdate(
        serviceId,
        { ...updateData },
        { new: true }
      );
      
      if (!updatedService) {
        throw new Error('Servicio no encontrado');
      }
      
      return updatedService;
    } catch (error) {
      throw error;
    }
  };