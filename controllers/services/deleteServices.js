import Service from '../../models/Service.js';

const deleteService = async (req, res) => {
    const { id } = req.params;

    try {
        const service = await Service.findByIdAndDelete(id);
        if (!service) {
            return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
        }

        return res.status(200).json({ success: true, message: 'Servicio eliminado exitosamente' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error interno en el servidor' });
    }
};

export default deleteService;
