import { Request, Response } from 'express';
import Product from '../models/productSchema';

// Soft delete a product
export const softDeleteProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.query;

    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({ error: 'Product ID is required and must be a string' });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if the product is already soft deleted
    if (!product.isActive) {
      return res.status(400).json({ message: 'Product has already been soft deleted' });
    }

    // Check if the product is active and perform soft delete
    if (product.isActive) {
      product.isActive = false; // Deactivate the product
      await product.save();
      return res.status(200).json({ message: 'Product soft deleted successfully' });
    } else {
      return res.status(400).json({ message: 'Product is already soft deleted' });
    }
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
};
