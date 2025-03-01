// src/controllers/notificationController.js
// Para manejar subscripción a notificaciones push
export const updatePushToken = async (req, res) => {
  try {
    const userId = req.user.id;
    const { pushToken } = req.body;
    
    // Actualizar el token de notificación del usuario
    await User.findByIdAndUpdate(userId, { pushToken });
    
    res.status(200).json({ message: 'Token actualizado correctamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};