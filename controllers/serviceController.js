// src/controllers/serviceController.js
import { 
  createService, 
  getAllServices, 
  getServicesByCategory, 
  updateService 
} from '../services/serviceService.js';

export const addService = async (req, res) => {
  try {  
    const serviceData = req.body;
    const service = await createService(serviceData);
    res.status(201).json({ data: service, success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllServicesList = async (req, res) => {
  try {
    const services = await getAllServices();
    res.status(200).json(services);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getServicesByCategoryList = async (req, res) => {
  try {
    const { category } = req.params;
    const services = await getServicesByCategory(category);
    res.status(200).json(services);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateServiceDetails = async (req, res) => {
  try {
    // Este endpoint debería ser solo para admins
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    
    const serviceId = req.params.id;
    const updateData = req.body;
    const updatedService = await updateService(serviceId, updateData);
    res.status(200).json(updatedService);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
