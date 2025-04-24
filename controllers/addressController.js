import * as addressService from '../services/addressService.js';

/**
 * Crear una nueva dirección
 */
export const createAddress = async (req, res) => {
    console.log('createAddress');
  try {
    const userId = req.user._id;
    const addressData = req.body;
    
    const address = await addressService.createAddress(userId, addressData);
    
    res.status(201).json({
      success: true,
      data: address
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Obtener todas las direcciones del usuario
 */
export const getUserAddresses = async (req, res) => {
  try {
    console.log(req.user)
    const userId = req.user._id;
    
    const addresses = await addressService.getUserAddresses(userId);
    
    res.status(200).json({
      success: true,
      data: addresses
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Obtener una dirección específica
 */
export const getAddressById = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.addressId;
    
    const address = await addressService.getAddressById(addressId, userId);
    
    res.status(200).json({
      success: true,
      data: address
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Obtener la dirección predeterminada del usuario
 */
export const getDefaultAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const address = await addressService.getDefaultAddress(userId);
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró dirección predeterminada'
      });
    }
    
    res.status(200).json({
      success: true,
      data: address
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Actualizar una dirección
 */
export const updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.addressId;
    const updateData = req.body;
    
    const updatedAddress = await addressService.updateAddress(addressId, userId, updateData);
    
    res.status(200).json({
      success: true,
      data: updatedAddress
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Establecer una dirección como predeterminada
 */
export const setDefaultAddress = async (req, res) => {

    console.log('setDefaultAddress');
  try {
    const userId = req.user.id;
    const addressId = req.params.addressId;
    
    const address = await addressService.setDefaultAddress(addressId, userId);
    
    res.status(200).json({
      success: true,
      data: address
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Eliminar una dirección
 */
export const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.addressId;
    
    const result = await addressService.deleteAddress(addressId, userId);
    
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Buscar direcciones cercanas (para administradores)
 */
export const findNearbyAddresses = async (req, res) => {
  try {
    // Verificar que el usuario es administrador
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No autorizado'
      });
    }
    
    const { longitude, latitude, maxDistance } = req.body;
    
    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren las coordenadas (longitude y latitude)'
      });
    }
    
    const addresses = await addressService.findNearbyAddresses(
      [parseFloat(longitude), parseFloat(latitude)], 
      maxDistance
    );
    
    res.status(200).json({
      success: true,
      data: addresses
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};