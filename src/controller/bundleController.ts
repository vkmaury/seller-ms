import { Request, Response } from 'express';
import Bundle from '../models/bundleSchema';
import Product from '../models/productSchema'; // Import the Product model
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

export const createBundle = async (req: Request, res: Response) => {
  try {
    const userId = extractUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if the user is active in auth-ms
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ message: 'Seller is not active' });
    }

    const { name, description, products, sellerDiscount = 0, isActive = true } = req.body; // Default isActive to true

    // Validate required fields
    if (!name || !products) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    // Check if all products are active and calculate the total MRP
    const productIds = products.map((p: { productId: string }) => p.productId);
    const foundProducts = await Product.find({ _id: { $in: productIds } }).exec();
    
    const inactiveProducts = foundProducts.filter(product => !product.isActive);
    if (inactiveProducts.length > 0) {
      const inactiveProductIds = inactiveProducts.map(p => p._id);
      return res.status(400).json({ error: `Products with IDs ${inactiveProductIds.join(', ')} are soft deleted and cannot be included in the bundle.` });
    }

    // Calculate the total MRP of the bundle
    let totalMRP = 0;
    for (const product of foundProducts) {
      const productInBundle = products.find((p: { productId: string }) => p.productId.toString() === product.id.toString());
      if (productInBundle) {
        totalMRP += product.MRP * productInBundle.quantity;
      }
    }

    // Apply seller discount
    const discountAmount = (totalMRP * sellerDiscount) / 100;
    const finalPrice = totalMRP - discountAmount;

    // Create and save the bundle
    const bundle = new Bundle({
      name,
      description,
      products,
      MRP: totalMRP, // Store the total MRP before discount
      sellerDiscount, // Store the discount percentage
      finalPrice, // Store the final price after discount
      sellerId: userId,
      isActive // Store the active status
    });

    await bundle.save();

    res.status(201).json(bundle);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unexpected error occurred.' });
    }
  }
};


export const getBundleById = async (req: Request, res: Response) => {
  try {
    const userId = extractUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Retrieve bundleId from query parameters
    const bundleId = req.query.id as string;
    if (!bundleId) {
      return res.status(400).json({ message: 'Bundle ID is required' });
    }

    // Fetch the bundle from the database
    const bundle = await Bundle.findById(bundleId).exec();
    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    // Check if the user is active in auth-ms
    const user = await User.findById(bundle.sellerId).exec();
    if (!user) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Seller is not active' });
    }

    // Check if the bundle is active
    if (!bundle.isActive) {
      return res.status(400).json({ message: 'Bundle is soft deleted' });
    }

    // Return the bundle details
    res.status(200).json(bundle);

  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unexpected error occurred.' });
    }
  }
};


export const getAllBundles = async (req: Request, res: Response) => {
  try {
    // Retrieve all bundles from the database
    const bundles = await Bundle.find().exec();

    // Prepare an array to store active bundles
    const activeBundles: any[] = [];

    // Iterate over each bundle to check the seller's status and the bundle's status
    for (const bundle of bundles) {
      // Check if the bundle is active
      if (bundle.isActive) {
        // Fetch the seller from auth-ms
        const seller = await User.findById(bundle.sellerId).exec();
        if (seller && seller.isActive) {
          // If the seller is active, add the bundle to the list of active bundles
          activeBundles.push(bundle);
        } else {
          // If the seller is inactive, continue to the next bundle
          continue;
        }
      }
    }

    // If no active bundles are found
    if (activeBundles.length === 0) {
      return res.status(404).json({ message: 'seller is inactive' });
    }

    // Return the list of active bundles
    res.status(200).json(activeBundles);

  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unexpected error occurred.' });
    }
  }
};

export const updateBundle = async (req: Request, res: Response) => {
  try {
    // Extract the bundle ID from query parameters
    const { id } = req.query;

    if (typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid bundle ID' });
    }

    // Retrieve the bundle by ID
    const bundle = await Bundle.findById(id).exec();

    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    // Check if the bundle is active
    if (!bundle.isActive) {
      return res.status(400).json({ message: 'Bundle is soft deleted' });
    }

    // Fetch the seller from auth-ms
    const seller = await User.findById(bundle.sellerId).exec();

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Check if the seller is active
    if (!seller.isActive) {
      return res.status(403).json({ message: 'Seller is inactive' });
    }

    // Proceed to update the bundle
    const { name, description, products, sellerDiscount, isActive } = req.body;

    // Validate required fields
    if (typeof name !== 'string' || typeof description !== 'string' || !Array.isArray(products)) {
      return res.status(400).json({ error: 'Required fields are missing or invalid' });
    }

    // Check if all products are active and calculate the total MRP
    const productIds = products.map((p: { productId: string }) => p.productId);
    const foundProducts = await Product.find({ _id: { $in: productIds } }).exec();
    
    const inactiveProducts = foundProducts.filter(product => !product.isActive);
    if (inactiveProducts.length > 0) {
      const inactiveProductIds = inactiveProducts.map(p => p._id);
      return res.status(400).json({ error: `Products with IDs ${inactiveProductIds.join(', ')} are soft deleted and cannot be included in the bundle.` });
    }

    // Calculate the total MRP of the bundle
    let totalMRP = 0;
    for (const product of foundProducts) {
      const productInBundle = products.find((p: { productId: string }) => p.productId.toString() === product.id.toString());
      if (productInBundle) {
        totalMRP += product.MRP * productInBundle.quantity;
      }
    }

    // Calculate the final price after applying the seller discount
    const discount = sellerDiscount || 0;
    const finalPrice = totalMRP - (totalMRP * discount / 100);

    console.log(finalPrice);

    // Update the bundle details
    bundle.name = name;
    bundle.description = description;
    bundle.products = products;
    if (typeof isActive === 'boolean') {
      bundle.isActive = isActive;
    }
    bundle.sellerDiscount = discount;
    bundle.finalPrice = finalPrice;
    bundle.MRP=totalMRP;

    // Save the updated bundle
    await bundle.save();

    // Return the updated bundle
    res.status(200).json(bundle);

  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unexpected error occurred.' });
    }
  }
};


export const softDeleteBundle = async (req: Request, res: Response) => {
  try {
    // Extract the bundle ID from query parameters
    const { id } = req.query;

    if (typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid bundle ID' });
    }

    // Retrieve the bundle by ID
    const bundle = await Bundle.findById(id).exec();

    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    // Fetch the seller from auth-ms
    const seller = await User.findById(bundle.sellerId).exec();

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Check if the seller is active
    if (!seller.isActive) {
      return res.status(403).json({ message: 'Seller is inactive' });
    }

    // Check if the bundle is already soft deleted
    if (!bundle.isActive) {
      return res.status(400).json({ message: 'Bundle is already soft deleted' });
    }

    // Soft delete the bundle by setting isActive to false
    bundle.isActive = false;
    await bundle.save();

    res.status(200).json({ message: 'Bundle has been soft deleted' });

  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unexpected error occurred.' });
    }
  }
};