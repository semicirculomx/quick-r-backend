import Cart from '../../models/Cart.js';
import Product from '../../models/Product.js';

const removeFromCart = async (req, res) => {
  const userId = req.user._id.toString();
  const { productId, quantity } = req.body;

  try {
    // Buscar el carrito del usuario, excluyendo productos null
    const cart = await Cart.findOne({ user: userId }).populate('products.product');

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Carro de compras no encontrado'
      });
    }

    // Filtrar productos nulos para que no afecten el proceso
    cart.products = cart.products.filter(p => p.product !== null);

    // Verificar si el producto está en el carrito (sin productos nulos)
    const productIndex = cart.products.findIndex(p => p.product._id.toString() === productId);

    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado en el carro de compras'
      });
    }

    const productInCart = cart.products[productIndex];

    // Actualizar la cantidad o eliminar el producto si la cantidad es 0 o menor
    if (quantity >= productInCart.quantity) {
      cart.products.splice(productIndex, 1);
    } else {
      productInCart.quantity -= quantity;
    }

    // Calcular el nuevo totalPrice directamente, excluyendo productos null
    cart.totalPrice = cart.products.reduce((total, item) => {
      // Asegurarse de que el producto no sea null antes de calcular el precio
      if (item.product && item.product.price) {
        return total + (item.product.price * item.quantity);
      }
      return total;
    }, 0);

    // Guardar el carrito
    await cart.save();

    return res.status(200).json({
      success: true,
      message: 'Producto eliminado del carrito',
      cart
    });
  } catch (error) {
    console.error('Error al eliminar el producto del carrito:', error);
    return res.status(500).json({
      success: false,
      message: 'Ocurrió un error al eliminar del carrito'
    });
  }
}

export default removeFromCart;