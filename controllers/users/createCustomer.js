import User from '../../models/User.js'
import bcryptjs from 'bcryptjs';
import crypto from 'crypto';

function generateFourDigitCode() {
    let code;
    do {
        // Genera 2 bytes de datos aleatorios
        const randomBytes = crypto.randomBytes(2);
        // Convierte los bytes en un número entero sin signo de 16 bits
        code = randomBytes.readUInt16BE(0);
    } while (code < 1000 || code > 9999);
    return code;
}

let createCustomer = async (req, res, next) => {
    req.body.verify_code = generateFourDigitCode()

    console.log(req.body)
    req.body.password = bcryptjs.hashSync(req.body.password, 10);
    try {
        await User.create(req.body);
        return res.status(201).json({
            success: true,
            message: "Usuario creado!"
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Error creando al usuario'
        });
    }
}

export default createCustomer;
