import Service from '../../models/Service.js';

const createService = async (req, res) => {
    const { title, description, price, category, images } = req.body;

    try {
        const newService = new Service({
            title,
            description,
            price,
            category,
            images
        });

        await newService.save();
        return res.status(201).json({ success: true, service: newService });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error interno en el servidor' });
    }
};

export default createService;
