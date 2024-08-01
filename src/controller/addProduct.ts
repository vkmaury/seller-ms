import { Request, Response } from 'express';
import Product from '../models/productSchema';
import ProductCategory from '../models/productCategorySchema';
import User from '../models/User'; // Import the User model

// Add a new product
export const addProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, MRP, stock, categoryId, discount, isActive, userId } = req.body;

    // Validate required fields
    if (!name || !description || !MRP || !stock || !categoryId || !userId) {
      return res.status(400).json({ error: 'Required fields are missing' });
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
      return res.status(403).json({ error: 'seller is not active. Cannot add product.' });
    }

    // Calculate discounted price
    let sellerDiscounted = MRP;
    if (discount) {
      sellerDiscounted = MRP - (MRP * discount / 100);
    }

    // Create a new product instance
    const product = new Product({
      name,
      description,
      MRP,
      stock,
      categoryId,
      discount,
      isActive,
      sellerDiscounted, // Set the new field
      userId // Ensure userId is set if used
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
