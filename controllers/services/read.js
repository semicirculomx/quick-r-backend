import Service from '../../models/Service.js';

const read = async (req, res) => {
    try {
        const { sort, title, priceOrder, category, page = 4, limit = 8 } = req.query;

        let queries = {};
        let sortOptions = {};
        let pagination = {
            limit: parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 8,
        };

        if (sort) sortOptions[sort] = 1; // Sort by the specified field in ascending order
        if (title) queries.title = new RegExp(title, 'i');
        if (priceOrder) {
            sortOptions.price = priceOrder === 'asc' ? 1 : -1; // Sort by price in ascending or descending order
        }
        if (category) queries.category = { $in: category.split(',') };

        // Pagination using page and limit
        
        const services = await Service.find(queries)
            .sort(sortOptions)
            .limit(pagination.limit)
            .populate("subcategory"); // Ensure this matches the field in your Service model


        // Total count of services matching the query (optional)
        const totalServices = await Service.countDocuments(queries);

        res.status(200).json({
            success: true,
            services,
            totalServices,
            limit: pagination.limit,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};

export default read;
