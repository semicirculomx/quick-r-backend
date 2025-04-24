import User from '../../models/User.js';

const getMyData = async (req, res) => {
  try {
    const { id } = req.user;
    const me = await User.findOne({ _id: id })
      .select('name email phone'); // Specify only the fields you want

    if (!me) {
      return res.status(404).json({
        message: 'Usuario no encontrado',
      });
    }

    return res.status(200).json(me); // Correct HTTP status code for success
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

export default getMyData;