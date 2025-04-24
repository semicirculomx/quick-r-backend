import User from '../../models/User.js';

const savePushToken = async (req, res, next) => {
  try {
    const userId = req.user.id; // Assuming `req.user` contains the authenticated user's data
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Push token is required.' });
    }

    const user = await User.findById(userId); // Replace with your database query
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.pushToken = token; // Save the push token to the user's record
    await user.save();

    return res.status(200).json({
        success: true,
        message: '¡Usuario actualizado con éxito!',
        user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'An error occurred while saving the push token.' });
  }
};

export default savePushToken;