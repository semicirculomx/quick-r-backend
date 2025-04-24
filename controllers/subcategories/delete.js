// controllers/categories/delete.js
import Subcategory from '../../models/SubCategory.js';

const deleteSubCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar y eliminar la categoría
    const deletedSubCategory = await Subcategory.findByIdAndDelete(id);

    if (!deletedSubCategory) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Categoría eliminada con éxito',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la categoría',
      error: error.message,
    });
  }
};

export default deleteSubCategory;
