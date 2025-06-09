import User from '../models/User.js';

const isAdmin = async (req, res, next) => {
    try {
        const userAdmin = await User.findById(req.user._id);
        if (!userAdmin) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }
        if (userAdmin.role !== 'admin') {
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

const isOwnerOrAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        // Verificar si es admin
        if (user.role === 1) {
            return next();
        }

        // Verificar si el usuario es dueño de la cuenta que intenta modificar/eliminar
        if (req.user._id.toString() === req.params.id) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: "No tienes permisos para realizar esta acción"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor",
            error: error.message,
        });
    }
};

export { isAdmin, isOwnerOrAdmin };