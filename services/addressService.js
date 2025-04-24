import Address from '../models/Address.js';

/**
 * Crear una nueva dirección para un usuario
 */
export const createAddress = async (userId, addressData) => {
  try {
    // Si esta dirección es la predeterminada, actualiza las otras direcciones
    if (addressData.isDefault) {
      await Address.updateMany(
        { user: userId, isDefault: true },
        { isDefault: false }
      );
    }

    // Si es la primera dirección, marcala como predeterminada
    const addressCount = await Address.countDocuments({ user: userId });
    if (addressCount === 0) {
      addressData.isDefault = true;
    }

    // Crear nueva dirección
    const address = new Address({
      ...addressData,
      user: userId
    });

    await address.save();
    return address;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtener todas las direcciones de un usuario
 */
export const getUserAddresses = async (userId) => {
  try {
    const addresses = await Address.find({ user: userId });
    return addresses;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtener una dirección específica por ID
 */
export const getAddressById = async (addressId, userId) => {
  try {
    const address = await Address.findOne({ _id: addressId, user: userId });
    
    if (!address) {
      throw new Error('Dirección no encontrada o no autorizada');
    }
    
    return address;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtener la dirección predeterminada de un usuario
 */
export const getDefaultAddress = async (userId) => {
  try {
    const address = await Address.findOne({ user: userId, isDefault: true });
    return address;
  } catch (error) {
    throw error;
  }
};

/**
 * Actualizar una dirección existente
 */
export const updateAddress = async (addressId, userId, updateData) => {
  try {
    // Verificar que la dirección pertenece al usuario
    const address = await Address.findOne({ _id: addressId, user: userId });
    
    if (!address) {
      throw new Error('Dirección no encontrada o no autorizada');
    }
    
    // Si se está estableciendo como predeterminada, actualizar las otras direcciones
    if (updateData.isDefault) {
      await Address.updateMany(
        { user: userId, isDefault: true },
        { isDefault: false }
      );
    }
    
    // Actualizar la dirección
    const updatedAddress = await Address.findByIdAndUpdate(
      addressId,
      { ...updateData },
      { new: true }
    );
    
    return updatedAddress;
  } catch (error) {
    throw error;
  }
};

/**
 * Establecer una dirección como predeterminada
 */
export const setDefaultAddress = async (addressId, userId) => {
  try {
    // Verificar que la dirección pertenece al usuario
    const address = await Address.findOne({ _id: addressId, user: userId });
    
    if (!address) {
      throw new Error('Dirección no encontrada o no autorizada');
    }
    
    // Quitar estado predeterminado de todas las direcciones del usuario
    await Address.updateMany(
      { user: userId },
      { isDefault: false }
    );
    
    // Establecer esta dirección como predeterminada
    address.isDefault = true;
    await address.save();
    
    return address;
  } catch (error) {
    throw error;
  }
};

/**
 * Eliminar una dirección
 */
export const deleteAddress = async (addressId, userId) => {
  try {
    // Verificar que la dirección pertenece al usuario
    const address = await Address.findOne({ _id: addressId, user: userId });
    
    if (!address) {
      throw new Error('Dirección no encontrada o no autorizada');
    }
    
    // Si era la dirección predeterminada, establecer otra como predeterminada
    if (address.isDefault) {
      const anotherAddress = await Address.findOne({ 
        user: userId, 
        _id: { $ne: addressId } 
      });
      
      if (anotherAddress) {
        anotherAddress.isDefault = true;
        await anotherAddress.save();
      }
    }
    
    // Eliminar la dirección
    await Address.findByIdAndDelete(addressId);
    
    return { message: 'Dirección eliminada correctamente' };
  } catch (error) {
    throw error;
  }
};

/**
 * Buscar direcciones cercanas a una ubicación
 */
export const findNearbyAddresses = async (coordinates, maxDistance = 5000) => {
  try {
    const addresses = await Address.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: coordinates // [longitude, latitude]
          },
          $maxDistance: maxDistance // en metros
        }
      }
    });
    
    return addresses;
  } catch (error) {
    throw error;
  }
};