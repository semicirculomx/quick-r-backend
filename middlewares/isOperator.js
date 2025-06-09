import User from '../models/User.js';

const isOperator = async (req, res, next) => {
    try {
        const operator = await User.findById(req.user._id);
        if (!operator) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }
        if (operator.role !== 'operator') {
            return res.status(403).json({
                success: false,
                message: "Error al verificar: No tienes acceso para ingresar"
            });
        }
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor",
            error: error.message,
        });
    }
};

export { isOperator };