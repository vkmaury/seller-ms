import { Request, Response } from 'express';
import ProductCategory from '../models/productCategorySchema'; // Adjust the import according to your project structure

export const getCategoryByIdController = async (req: Request, res: Response) => {
  const { id } = req.query;

  // Validate input
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid or missing category ID' });
  }

  try {
    // Fetch the category by ID
    const category = await ProductCategory.findById(id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if the category is active
    if (!category.isActive) {
      return res.status(404).json({ message: 'Category has been soft deleted' });
    }

    return res.status(200).json({
      message: 'Category retrieved successfully',
      category,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to retrieve category', error });
  }
};
