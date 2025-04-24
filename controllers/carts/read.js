import Cart from '../../models/Cart.js';

const getCart = async (req, res, next) => {
    const userId = req.user._id;
    try {
        // Buscar el carrito del usuario con el ID proporcionado
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Carro de compras no encontrado'
            });
        }

        // Filtrar productos nulos directamente en la base de datos
        const originalLength = cart.products.length;
        cart.products = cart.products.filter(item => item.product !== null);

        // Guardar solo si se eliminaron productos
        if (cart.products.length !== originalLength) {
            await cart.save();
        }

        // Volver a popular el carrito limpio
        await cart.populate('products.product');

        return res.status(200).json({
            success: true,
            cart
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Ocurrió un error al obtener el carro de compras'
        });
    }
}

export default getCart;

