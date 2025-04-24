import Product from '../../models/Product.js';

const read = async (req, res) => {
    try {
        const { sort, name, priceOrder, category, page = 1, limit } = req.query;

        // Validar y establecer el límite de resultados por página
        const paginationLimit = limit && parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 8;

        let queries = { stock: { $gt: 0 } }; // Solo productos con 1 o más en stock
        let sortOptions = {};

        // Validar y convertir page a entero
        const currentPage = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;

        if (sort) sortOptions[sort] = 1; // Ordenar por el campo especificado en orden ascendente
        if (name) {
            const regex = new RegExp(name, 'i'); // Case-insensitive regex for partial matches
        
            queries.$or = [
                { name: regex }, // Search by product name
                { description: regex }, // Search by product description
            ];
        }
        if (priceOrder) sortOptions.price = priceOrder === 'asc' ? 1 : -1; // Ordenar por precio ascendente o descendente
        if (category) queries.category = { $in: category.split(',') }; // Filtrar por categorías

        // Calcular el número de documentos a omitir para la paginación
        const skip = (currentPage - 1) * paginationLimit;

        // Obtener productos con paginación, filtro y ordenación
        const products = await Product.find(queries)
            .sort(sortOptions)
            .populate("subcategory"); // Ensure this matches the field in your Product model
            // .skip(skip)
            // .limit(paginationLimit);

        // Contar el total de productos que coinciden con la consulta
        const totalProducts = await Product.countDocuments(queries);

        res.status(200).json({
            success: true,
            products,
            totalProducts,
            currentPage,
            totalPages: Math.ceil(totalProducts / paginationLimit),
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