import Order from '../../models/Order.js';
import Service from '../../models/Service.js';

const getTopOrderedServices = async (req, res) => {
  try {
    // Obtener todos los servicios ordenados con su cantidad total vendida
    const topServices = await Order.aggregate([
      // Descomponer las órdenes por servicio
      { $unwind: '$services' },

      // Agrupar por serviceId y sumar las cantidades vendidas
      {
        $group: {
          _id: '$services.service', // Agrupa por el ID del servicio
          totalSold: { $sum: '$services.quantity' }, // Suma la cantidad vendida
        },
      },

      // Filtrar solo los servicios que aún existen y tienen stock
      {
        $lookup: {
          from: 'services', // Colección "services"
          localField: '_id', // Campo a relacionar desde la colección actual
          foreignField: '_id', // Campo de la colección "services" para relacionar
          as: 'serviceData', // Resultado almacenado en "serviceData"
        },
      },
      { $unwind: '$serviceData' }, // Descomponer el array de resultados

      // Filtrar por stock positivo
      { $match: { 'serviceData.stock': { $gt: 0 } } },

      // Ordenar por la cantidad total vendida de mayor a menor
      { $sort: { totalSold: -1 } },

      // Limitar a los top 10 servicios
      { $limit: 10 },

      // Proyectar solo los campos necesarios
      {
        $project: {
          _id: 0,
          serviceId: '$_id',
          title: '$serviceData.name',
          description: '$serviceData.description',
          price: '$serviceData.price',
          category: '$serviceData.category',
          images: '$serviceData.images',
        },
      },
    ]);

    // Verificar si hay servicios en la lista
    if (topServices.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontraron servicios más pedidos.',
      });
    }

    res.status(200).json({
      success: true,
      data: topServices,
    });
  } catch (error) {
    console.error('Error obteniendo los servicios más pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los servicios más pedidos.',
    });
  }
};

export default getTopOrderedServices