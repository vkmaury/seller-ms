import { Request, Response } from 'express';
import Product from '../models/productSchema';
import User from '../models/User'; // Import the User model

// Get a product by ID
export const getProductById = async (req: Request, res: Response) => {
  try {
    const productId = req.query.id; // Extract the product ID from URL parameters

    // Validate product ID
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Fetch the product from the database
    const product = await Product.findById(productId).populate('categoryId').exec();
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!product.isActive) {
      return res.status(403).json({ error: 'product is soft deleted. Cannot retrieve product.' });
    }


    // Fetch the user associated with the product
    const user = await User.findById(product.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the user is active
    if (!user.isActive) {
      return res.status(403).json({ error: 'seller is not active. Cannot retrieve product.' });
    }

    // Send a success response with the product details
    res.status(200).json(product);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
};
