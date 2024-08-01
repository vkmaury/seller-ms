// import { Request, Response } from 'express';
// import Discount from '../models/discountModel';
// import Product from '../models/productSchema';
// import mongoose from 'mongoose';

// // Utility function to validate if a date is in the past
// const isDateInThePast = (date: Date): boolean => {
//   return date < new Date();
// };

// export const createDiscountController = async (req: Request, res: Response) => {
//   try {
//     const productId = req.query.productId as string;
//     const { discountPercentage, startDate, endDate } = req.body;

//     // Validate dates
//     const start = new Date(startDate);
//     const end = new Date(endDate);

//     if (isDateInThePast(start) || isDateInThePast(end)) {
//       return res.status(400).json({ message: 'Start and end dates cannot be in the past' });
//     }

//     if (start > end) {
//       return res.status(400).json({ message: 'Start date cannot be after end date' });
//     }

//     // Create and save the discount
//     const discount = new Discount({ productId, discountPercentage, startDate, endDate });
//     await discount.save();

//     // Update product price
//     const product = await Product.findById(productId);
//     if (!product) {
//       return res.status(404).json({ message: 'Product not found' });
//     }
//     const originalPrice = product.price;
//     const discountedPrice = originalPrice - (originalPrice * (discountPercentage / 100));
//     await Product.findByIdAndUpdate(productId, { price: discountedPrice, discount: discountPercentage });

//     res.status(201).json(discount);
//   } catch (error) {
//     if (error instanceof Error) {
//       res.status(500).json({ message: error.message });
//     } else {
//       res.status(500).json({ message: 'An unexpected error occurred.' });
//     }
//   }
// };

// export const updateDiscountController = async (req: Request, res: Response) => {
//   try {
//     const discountId = req.query.discountId as string;
//     const updateData = req.body;

//     if (!discountId) {
//       return res.status(400).json({ message: 'Discount ID is required' });
//     }

//     // Validate dates if necessary
//     const startDate = updateData.startDate ? new Date(updateData.startDate) : null;
//     const endDate = updateData.endDate ? new Date(updateData.endDate) : null;

//     if (startDate && endDate) {
//       if (isDateInThePast(startDate) || isDateInThePast(endDate)) {
//         return res.status(400).json({ message: 'Start and end dates cannot be in the past' });
//       }

//       if (startDate > endDate) {
//         return res.status(400).json({ message: 'Start date cannot be after end date' });
//       }
//     }

//     const discount = await Discount.findById(discountId);
//     if (!discount) {
//       return res.status(404).json({ message: 'Discount not found' });
//     }

//     const updatedDiscount = await Discount.findByIdAndUpdate(discountId, updateData, { new: true });
//     if (!updatedDiscount) {
//       return res.status(404).json({ message: 'Discount not found' });
//     }

//     // Update the product with the new discount percentage
//     const product = await Product.findById(updatedDiscount.productId);
//     if (!product) {
//       return res.status(404).json({ message: 'Product not found' });
//     }
//     const originalPrice = product.price;
//     const discountedPrice = originalPrice - (originalPrice * (updatedDiscount.discountPercentage / 100));
//     await Product.findByIdAndUpdate(updatedDiscount.productId, { price: discountedPrice, discount: updatedDiscount.discountPercentage });

//     res.status(200).json(updatedDiscount);
//   } catch (error) {
//     if (error instanceof Error) {
//       res.status(500).json({ message: error.message });
//     } else {
//       res.status(500).json({ message: 'An unexpected error occurred.' });
//     }
//   }
// };

// export const deleteDiscountController = async (req: Request, res: Response) => {
//   try {
//     const discountId = req.query.discountId as string;

//     // Ensure discountId is of type ObjectId
//     const discountIdObjectId = new mongoose.Types.ObjectId(discountId);

//     // Find the discount by ID
//     const discount = await Discount.findById(discountIdObjectId);
//     if (!discount) {
//       return res.status(404).json({ message: 'Discount not found' });
//     }

//     // Find the product associated with the discount
//     const product = await Product.findById(discount.productId);
//     if (!product) {
//       return res.status(404).json({ message: 'Product not found' });
//     }

//     // Restore the original price of the product
//     const originalPrice = await getOriginalProductPrice(discount.productId.toString());
//     if (originalPrice === undefined) {
//       return res.status(500).json({ message: 'Original price not found' });
//     }

//     await Product.findByIdAndUpdate(discount.productId, { price: originalPrice, discount: null });

//     // Delete the discount
//     await Discount.findByIdAndDelete(discountIdObjectId);

//     res.status(200).json({ message: 'Discount deleted successfully' });
//   } catch (error) {
//     if (error instanceof Error) {
//       res.status(500).json({ message: error.message });
//     } else {
//       res.status(500).json({ message: 'An unexpected error occurred.' });
//     }
//   }
// };

// // Function to get the original product price
// const getOriginalProductPrice = async (productId: string): Promise<number | undefined> => {
//   // Retrieve the product from the database
//   const product = await Product.findById(productId);
//   if (product) {
//     return product.originalPrice; // Return the original price stored in the product document
//   }
//   return undefined;
// };
