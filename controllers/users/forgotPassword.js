import crypto from 'crypto';
import User from '../../models/User.js';
import jwt from 'jsonwebtoken';
import sendEmail from '../../utils/mailing.util.js';

let forgotPassword = async (req, res, next) => {
    const { email } = req.body;
    
    try {
        let user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No existe este usuario"
            });
        }

        // Generar un token de restablecimiento de contraseña
        const token = jwt.sign(
            { id: user._id },
            process.env.SECRET,
            { expiresIn: '1h' } 
        );


        // Enviar un correo electrónico con el token
        const resetUrl = `https://dashboard.quickr.com.mx/reset-password/?token=${token}`;
        await sendEmail({
            to: user.email,
            subject: 'Solicitud de reestablecimiento de contraseña',
            template: `Si tu solicitaste reestablecer tu contraseña porfavor accede a este enlace para cambiar tu contraseña: ${resetUrl}`
        });

        return res.status(200).json({
            success: true,
            message: 'Password reset token sent to email'
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while processing your request'
        });
    }
}

export default forgotPassword;
