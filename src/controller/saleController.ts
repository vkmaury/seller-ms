import { Request, Response } from 'express';
import mongoose, { isValidObjectId } from 'mongoose';
import moment from 'moment';
import jwt from 'jsonwebtoken';

const { ObjectId } = mongoose.Types;

import Sale from '../models/saleSchema';
import Product from '../models/productSchema';

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

export const addProductToSale = async (req: Request, res: Response) => {
  try {
    const id = extractUserId(req);
    if (!id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { saleId } = req.query;
    const { productIds } = req.body;

    if (!saleId || !isValidObjectId(saleId)) {
      return res.status(400).json({ error: 'Invalid sale ID.' });
    }

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: 'Product IDs are required.' });
    }

    const errors: string[] = [];

    // Validate each productId
    for (const productId of productIds) {
      if (!isValidObjectId(productId)) {
        errors.push(`Invalid product ID: ${productId}`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: errors });
    }

    // Find the sale details
    const sale = await Sale.findOne({ _id: saleId, isActive: true });
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found or is deleted.' });
    }

    // Validate sale dates
    const endDate = moment(sale.endDate);
    const now = moment().startOf('seconds');
    if (endDate.isBefore(now)) {
      return res.status(400).json({ error: 'Sale is expired or ended.' });
    }

    // Find products by IDs
    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true,
      isBlocked: false,
    });

    if (products.length === 0) {
      return res.status(404).json({ error: 'No products found with the given IDs.' });
    }

    // Check if products belong to the seller
    const unauthorizedProducts: string[] = [];
    const categoryMismatchProducts: string[] = [];
    for (const product of products) {
      if (product.userId.toString() !== id) {
        unauthorizedProducts.push(product._id.toString());
      }
     for(const categoryId of sale.categories){
      if (product.categoryId.toString() !== categoryId.toString()) {
        categoryMismatchProducts.push(product._id.toString());
      }
    }
  }

    if (unauthorizedProducts.length > 0) {
      return res.status(403).json({
        error: `You are not authorized to add products with IDs: ${unauthorizedProducts.join(', ')}`,
      });
    }

    if (categoryMismatchProducts.length > 0) {
      return res.status(400).json({
        error: `Products with IDs: ${categoryMismatchProducts.join(', ')} do not match the sale category.`,
      });
    }

    // Update product prices based on the saleDiscount
    const updatedProducts = await Promise.all(
      products.map(async (product) => {
        // Check if the product is already in the sale
        const isProductInSale = sale.affectedProducts.some(
          (saleProduct) => saleProduct.productId.toString() === product._id.toString()
        );

        // Check if the product already has sale applied
        if (product.saleApplied) {
          errors.push(`Product ${product.name} already has a sale applied`);
          return null;
        }

        if (isProductInSale) {
          errors.push(`Product ${product.name} is already in the sale`);
          return null;
        }

        let discountedPrice = product.finalePrice;

        // Check that MRP and saleDiscount are valid numbers
        if (
          sale.isAppliedSale &&
          typeof product.MRP === 'number' &&
          product.MRP > 0 &&
          typeof sale.saleDiscountApplied === 'number'
        ) {
          discountedPrice =
            product.MRP - (product.MRP * sale.saleDiscountApplied) / 100;

          // Ensure the discounted price is a valid number
          if (isNaN(discountedPrice) || discountedPrice < 0) {
            errors.push(`Invalid price calculation for product ${product.name}`);
            return null;
          }

          product.finalePrice = discountedPrice;
          product.saleApplied = true;
          await product.save();
        }
          
        // Add the product to the sale's affectedProducts array
        sale.affectedProducts.push({
          productId: product._id,
          categoryId: product.categoryId, // Add categoryId field here
          productName: product.name,
          productMRP: product.MRP,
          finalePrice: product.finalePrice,
          isUnavailable: false,
        });

        await product.save();

        return product;
      })
    );

    // Save the sale with the updated products
    await sale.save();

    return res.status(200).json({
      success: true,
      errors: errors.length > 0 ? errors : undefined,
      sale: sale,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: (error as Error).message });
  }
};


export const removeProductFromSale = async (req: Request, res: Response) => {
    try {
      const id = extractUserId(req);
      if (!id) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
  
      const { saleId } = req.query;
      const { productIds } = req.body;
  
      if (!saleId || !isValidObjectId(saleId)) {
        return res.status(400).json({ error: 'Invalid sale ID.' });
      }
  
      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ error: 'Product IDs are required.' });
      }
  
      const errors: string[] = [];
  
      // Validate each productId
      for (const productId of productIds) {
        if (!isValidObjectId(productId)) {
          errors.push(`Invalid product ID: ${productId}`);
        }
      }
  
      if (errors.length > 0) {
        return res.status(400).json({ error: errors });
      }
  
      // Find the sale details
      const sale = await Sale.findOne({ _id: saleId, isActive: true });
      if (!sale) {
        return res.status(404).json({ error: 'Sale not found or is deleted.' });
      }
  
      // Find products by IDs
      const products = await Product.find({
        _id: { $in: productIds },
        isActive: true,
      });
  
      if (products.length === 0) {
        return res.status(404).json({ error: 'No products found with the given IDs.' });
      }
  
      // Check if products belong to the seller
      const unauthorizedProducts: string[] = [];
      for (const product of products) {
        if (product.userId.toString() !== id) {
          unauthorizedProducts.push(product._id.toString());
        }
      }
  
      if (unauthorizedProducts.length > 0) {
        return res.status(403).json({
          error: `You are not authorized to remove products with IDs: ${unauthorizedProducts.join(', ')}`,
        });
      }
  
      // Remove the products from the sale's affectedProducts array
      sale.affectedProducts = sale.affectedProducts.filter(
        (saleProduct) => !productIds.includes(saleProduct.productId.toString())
      );
  
      // Update the products to remove the sale applied flag
      await Product.updateMany(
        { _id: { $in: productIds } },
        { $set: { saleApplied: false, finalePrice: null } }
      );
  
      // Save the sale with the updated products
      await sale.save();
  
      return res.status(200).json({
        success: true,
        message: 'Products removed from sale successfully.',
        sale: sale,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: (error as Error).message });
    }
  };


  export const getSaleById = async (req: Request, res: Response) => {
    try {
      const { saleId } = req.query;
  
      if (!saleId || !isValidObjectId(saleId)) {
        return res.status(400).json({ error: 'Invalid sale ID.' });
      }
  
      // Find the sale by ID, only if it is active
      const sale = await Sale.findOne({ _id: saleId, isActive: true });
  
      if (!sale) {
        return res.status(404).json({ error: 'Sale not found or is inactive.' });
      }
  
      return res.status(200).json({
        success: true,
        sale
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: (error as Error).message });
    }
  };

  export const getAllSales = async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
  
      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);
      const searchTerm = search as string;
  
      // Validate pagination inputs
      if (isNaN(pageNumber) || pageNumber <= 0) {
        return res.status(400).json({ error: 'Invalid page number.' });
      }
      if (isNaN(limitNumber) || limitNumber <= 0) {
        return res.status(400).json({ error: 'Invalid limit number.' });
      }
  
      // Query to find active sales with optional name search
      const query: any = { isActive: true };
      if (searchTerm) {
        query.name = { $regex: searchTerm, $options: 'i' }; // Case-insensitive search
      }
  
      // Get total count of active sales
      const totalSales = await Sale.countDocuments(query);
  
      // Get active sales with pagination, sorting, and searching
      const sales = await Sale.find(query)
        .sort({ name: 1 }) // Sort by name in ascending order
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber);
  
      return res.status(200).json({
        success: true,
        totalSales,
        totalPages: Math.ceil(totalSales / limitNumber),
        currentPage: pageNumber,
        sales
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: (error as Error).message });
    }
  };
  
  
  
