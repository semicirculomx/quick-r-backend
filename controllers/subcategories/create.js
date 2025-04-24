// controllers/categories/create.js
import Subcategory from '../../models/SubCategory.js';

const create = async (req, res) => {
    try {
    const { name, image, description } = req.body;

    // Crear la nueva categoría
    const newSubCategory = new Subcategory({ name, image, description });
    await newSubCategory.save();

    res.status(201).json({
      success: true,
      message: 'Categoría creada con éxito',
      subcategory: newSubCategory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al crear la categoría',
      error: error.message,
    });
  }
};

export default create;
