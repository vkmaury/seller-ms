import { Request, Response } from 'express';
import Product from '../models/productSchema';
import ProductCategory from '../models/productCategorySchema';
import User from '../models/User'; // Import the User model

import jwt from 'jsonwebtoken';

// Middleware to extract userId from token
const extractUserId = (req: Request): string | null => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return null;

  try {
    const decoded: any = jwt.verify(token, 'mysecretkey');
    return decoded.id;
  } catch {
    return null;
  }
};

// Add a new product
export const addProduct = async (req: Request, res: Response) => {
  try {
    const id = extractUserId(req);
    if (!id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { name, description, MRP, stock, categoryId, sellerDiscountApplied, isActive = true, isUnavailable = false } = req.body;
    
    const userId = id;

    // Validate required fields
    if (!name || !description || !MRP || !stock || !categoryId) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    // Validate sellerDiscountApplied
    if (sellerDiscountApplied !== undefined) {
      if (sellerDiscountApplied < 0 || sellerDiscountApplied > 100) {
        return res.status(400).json({ error: 'sellerDiscountApplied must be between 0 and 100' });
      }
    }

    // Check if category exists
    const category = await ProductCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if user exists and is active
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!user.isActive) {
      return res.status(403).json({ error: 'Seller is not active. Cannot add product.' });
    }

    // Calculate discounted price
    let sellerDiscounted;
    if (sellerDiscountApplied) {
      sellerDiscounted = MRP - (MRP * sellerDiscountApplied / 100);
    }

    // Create a new product instance
    const product = new Product({
      name,
      description,
      MRP,
      stock,
      categoryId,
      sellerDiscountApplied,
      isActive,
      isBlocked: false,
      sellerDiscounted,
      userId,
      isUnavailable,
    });

    // Save the product to the database
    await product.save();

    // Fetch the saved product details along with the category
    const savedProduct = await Product.findById(product._id)
      .populate('categoryId') // Populate category details
      .exec();

    // Send a success response with product and category details
    res.status(201).json(savedProduct);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
};
