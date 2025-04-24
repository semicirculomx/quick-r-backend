import Service from '../../models/Service.js';

const updateService = async (req, res) => {
    const { id } = req.params;
    const { title, description, price, category,  images } = req.body;

    try {
        const service = await Service.findByIdAndUpdate(
            id,
            { title, description, price, category,  images },
            { new: true }  // Esto devuelve el documento actualizado
        );

        if (!service) {
            return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
        }

        return res.status(200).json({ success: true, service });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error interno en el servidor' });
    }
};

export default updateService;
