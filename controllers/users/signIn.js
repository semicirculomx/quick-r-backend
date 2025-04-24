import User from '../../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs'; 


let signin = async (req, res, next) => {
    try {

        const user = req.user;

        const isMatch = await bcrypt.compare(req.body.password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        const online = await User.findByIdAndUpdate(
            user._id,
            {is_online: true},
            { new: true }
          );
      

        const token = jwt.sign(
            { id: user._id },
            process.env.SECRET,
            { expiresIn: '365d' } 
        );


        return res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                phone:user.phone,
                name:user.name
            }
        });
    } catch (error) {
        console.error(error);
        next(error); 
    }
}

export default signin;
