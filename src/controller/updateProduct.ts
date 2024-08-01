import { Request, Response } from 'express';
import Product from '../models/productSchema';
import ProductCategory from '../models/productCategorySchema';
import User from '../models/User'; // Import the User model

// Update an existing product
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.query; // Extract productId from query parameters
    const { name, description, MRP, stock, categoryId, discount, isActive, userId } = req.body;

    // Validate required fields
    if (!name && !description && !MRP && !stock && !categoryId && !discount && !isActive && !userId) {
      return res.status(400).json({ error: 'No fields provided for update' });
    }

    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({ error: 'Product ID is required and must be a string' });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!product.isActive) {
      return res.status(404).json({ error: 'Product is soft deleted , can not update this product ' });
    }

    // Check if category exists if categoryId is provided
    if (categoryId) {
      const category = await ProductCategory.findById(categoryId);
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
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
   

    // Update product fields
    product.name = name || product.name;
    product.description = description || product.description;
    product.MRP = MRP || product.MRP;
    product.stock = stock || product.stock;
    product.categoryId = categoryId || product.categoryId;
    product.discount = discount || product.discount;
    product.isActive = isActive !== undefined ? isActive : product.isActive;
    product.userId = userId || product.userId;

    // Calculate discounted price
    if (discount !== undefined && MRP) {
      product.sellerDiscounted = MRP - (MRP * (discount / 100));
    }

    // Save updated product to the database
    const updatedProduct = await product.save();

    // Fetch the updated product details along with the category
    const populatedProduct = await Product.findById(updatedProduct._id)
      .populate('categoryId') // Populate category details
      .exec();

    // Send a success response with updated product and category details
    res.status(200).json(populatedProduct);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
};
