import Service from '../../models/Service.js';

const read = async (req, res) => {
    try {
        const { sort, title, priceOrder, category, page = 1, limit } = req.query;

        // Validar y establecer el límite de resultados por página
        const paginationLimit = limit && parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 8;

        let queries = { isActive: { $in: true } }; // Solo servicios con 1 o más en stock
        let sortOptions = {};

        // Validar y convertir page a entero
        const currentPage = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;

        if (sort) sortOptions[sort] = 1; // Ordenar por el campo especificado en orden ascendente
        if (title) {
            const regex = new RegExp(title, 'i'); // Case-insensitive regex for partial matches
        
            queries.$or = [
                { title: regex }, // Search by service title
                { description: regex }, // Search by service description
            ];
        }
        if (priceOrder) sortOptions.price = priceOrder === 'asc' ? 1 : -1; // Ordenar por precio ascendente o descendente
        if (category) queries.category = { $in: category.split(',') }; // Filtrar por categorías

        // Calcular el número de documentos a omitir para la paginación
        const skip = (currentPage - 1) * paginationLimit;

        // Obtener servicios con paginación, filtro y ordenación
        const services = await Service.find(queries)
            .sort(sortOptions)
            .populate("category"); // Ensure this matches the field in your Service model
            // .skip(skip)
            // .limit(paginationLimit);

        // Contar el total de servicios que coinciden con la consulta
        const totalServices = await Service.countDocuments(queries);

        res.status(200).json({
            success: true,
            services,
            totalServices,
            currentPage,
            totalPages: Math.ceil(totalServices / paginationLimit),
            limit: paginationLimit,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message, // Incluyendo el mensaje de error para mayor detalle
        });
    }
};

export default read;