import { Request, Response } from 'express';
import Product from '../models/productSchema';
import ProductCategory from '../models/productCategorySchema';
import User from '../models/User'; // Import the User model
import Discount from '../models/discountModel';

// Update an existing product
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.query; // Extract productId from query parameters
    const { name, description, MRP, stock, categoryId, sellerDiscountApplied, isActive, userId } = req.body;

    // Validate required fields
    if (!name && !description && !MRP && !stock && !categoryId && sellerDiscountApplied === undefined && isActive === undefined) {
      return res.status(400).json({ error: 'No fields provided for update' });
    }

     // Validate sellerDiscountApplied
     if (sellerDiscountApplied !== undefined) {
      if (sellerDiscountApplied < 0 || sellerDiscountApplied > 100) {
        return res.status(400).json({ error: 'sellerDiscountApplied must be between 0 and 100' });
      }
    }

    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({ error: 'Product ID is required and must be a string' });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.isBlocked) {
      return res.status(404).json({ message: 'Product is blocked; you cannot update this product' });
    }

    // Check if category exists if categoryId is provided
    if (categoryId) {
      const category = await ProductCategory.findById(categoryId);
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      if (!category.isActive) {
        return res.status(404).json({ error: 'This Category is Inactive' });
      }
    }

    // Fetch the user associated with the product
    const user = await User.findById(product.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the user is active
    if (!user.isActive) {
      return res.status(403).json({ error: 'Seller is not active. Cannot update product.' });
    }

      // Recalculate the discounted price
      const newSellerDiscounted = product.MRP - (product.MRP * sellerDiscountApplied / 100);

      // Update the product with the new discount and recalculated discounted price
      product.sellerDiscountApplied = sellerDiscountApplied;
      product.sellerDiscounted = newSellerDiscounted;

      const discount = await Discount.findById(product.discountId);

     if(product.sellerDiscounted  &&  discount && discount.type === 'sellerDiscounted'){
      if (product.sellerDiscounted !== undefined && product.adminDiscountApplied && product.adminDiscountedPrice !== undefined) {
        const discountAmount = (product.sellerDiscounted ?? 0) * (product.adminDiscountApplied / 100);
        product.adminDiscountedPrice = (product.sellerDiscounted ?? 0) - discountAmount;
      }
     }

     if(product.sellerDiscounted  &&  discount && discount.type === 'MRP'){
      if (product.MRP !== undefined && product.adminDiscountApplied && product.adminDiscountedPrice !== undefined) {
        const discountAmount = (product.MRP?? 0) * (product.adminDiscountApplied / 100);
        product.adminDiscountedPrice = (product.MRP ?? 0) - discountAmount;
      }
     }

    // Update product fields
    product.name = name || product.name;
    product.description = description || product.description;
    product.MRP = MRP || product.MRP;
    product.stock = stock || product.stock;
    product.categoryId = categoryId || product.categoryId;
    // product.sellerDiscountApplied = sellerDiscountApplied || product.sellerDiscountApplied;
    product.isActive = isActive !== undefined ? isActive : product.isActive;

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
