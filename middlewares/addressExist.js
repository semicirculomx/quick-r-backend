const addressExist = async (req, res, next) => {
    const { addressId } = req.body;

    // Verificar si la dirección de entrega está presente en el cuerpo de la solicitud
    if (!addressId) {
        return res.status(400).json({
            success: false,
            message: 'No se ha proporcionado una dirección de entrega.'
        });
    }

    // Si la dirección de entrega existe, continuar con el siguiente middleware o controlador
    next();
};

export default addressExist;
