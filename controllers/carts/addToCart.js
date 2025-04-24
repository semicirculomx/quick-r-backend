import Product from '../../models/Product.js';
import Cart from '../../models/Cart.js';

const addToCart = async (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.user._id.toString();

    if (!productId || !quantity || quantity <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Producto y cantidad son requeridos y la cantidad debe ser mayor a 0'
        });
    }

    try {
        // Get product and validate stock
        const product = await Product.findOne({
            _id: productId,
            stock: { $gte: quantity }
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado o sin stock suficiente'
            });
        }

        // Find or create cart
        let cart = await Cart.findOne({ user: userId }).populate('products.product', 'price');

        if (!cart) {
            cart = new Cart({
                user: userId,
                products: [],
                totalPrice: 0
            });
        }

        // Ensure products array exists
        cart.products = Array.isArray(cart.products) ? cart.products : [];

        // Find existing product in cart
        const existingProduct = cart.products.find((p) => p.product && p.product._id.toString() === productId);

        if (existingProduct) {
            const newQuantity = existingProduct.quantity + quantity;

            // Validate combined quantity against stock
            if (product.stock < newQuantity) {
                return res.status(400).json({
                    success: false,
                    message: 'No hay suficiente stock para la cantidad total'
                });
            }

            existingProduct.quantity = newQuantity;
        } else {
            cart.products.push({
                product: product._id,
                quantity: quantity
            });
        }

        // Recalculate total price
        cart.totalPrice = cart.products.reduce((total, item) => {
            const productPrice = item.product?.price || product.price; // Use populated price or fetched product price
            return total + (productPrice * item.quantity);
        }, 0);

        // Save cart
        await cart.save();

        // Populate cart products before sending response
        const populatedCart = await Cart.findById(cart._id).populate('products.product');

        return res.status(200).json({
            success: true,
            cart: populatedCart
        });
    } catch (error) {
        console.error('Error en addToCart:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno en el servidor',
            error: error.message || undefined
        });
    }
};

export default addToCart;