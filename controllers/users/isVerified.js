import User from '../../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs'; 

let userIsVerified = async (req, res, next) => {
    try {

        let { email } = req.body

        let userVerified = await User.findOneAndUpdate(
            { verify_code: req.params.verify_code, email },
            { is_verified: true },
            { new: true }
        )
        const token = jwt.sign(
                    { id: userVerified._id },
                    process.env.SECRET,
                    { expiresIn: '365d' } 
                );
        if (userVerified) {
            return res.status(200).json({
                success: true,
                token: token,
                user: userVerified
            });
        }
        return res.status(400).json({
            success: false,
            message: "Error validando tu código"
        });
    } catch (error) {
        next(error);
    }
};

export default userIsVerified;