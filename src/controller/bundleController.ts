import { Request, Response } from 'express';
import Bundle from '../models/bundleSchema';
import Product from '../models/productSchema'; // Import the Product model
import User from '../models/User'; // Import the User model
import jwt from 'jsonwebtoken';
import Sale from '../models/saleSchema'; 
import Discount from '../models/discountModel';
import Wishlist from '../models/wishlistSchema'; // Import Wishlist model
import Cart from '../models/addToCartSchema'; // Import Cart model

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
    const userId = extractUserId(req); // Ensure this function extracts user ID from the request correctly
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

    const { name, description, products, sellerDiscount, stock, isActive = true } = req.body; // Default isActive to true

    // Validate required fields
    if (!name || !products || !stock) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    // Validate sellerDiscount
    if (sellerDiscount < 0 || sellerDiscount > 100) {
      return res.status(400).json({ error: 'sellerDiscount must be between 0 and 100' });
    }

    // Check if all products exist in the database
    const productIds = products.map((p: { productId: string }) => p.productId);
    const foundProducts = await Product.find({ _id: { $in: productIds } }).exec();

    // Check if any products do not exist
    const existingProductIds = foundProducts.map((p) => p._id.toString());
    const nonExistentProducts = productIds.filter(
      (productId: string) => !existingProductIds.includes(productId)
    );

    if (nonExistentProducts.length > 0) {
      return res.status(404).json({ error: `Products with IDs ${nonExistentProducts.join(', ')} do not exist.` });
    }

    // Check if any products are blocked
    const blockedProducts = foundProducts.filter(product => product.isBlocked);
    if (blockedProducts.length > 0) {
      const blockedProductIds = blockedProducts.map(p => p._id);
      return res.status(400).json({ error: `Products with IDs ${blockedProductIds.join(', ')} are blocked and cannot be included in the bundle.` });
    }

    // Validate if products belong to the seller and check stock availability
    const invalidProducts = foundProducts.filter(product => 
      !product.isActive || product.userId.toString() !== userId.toString()
    );
    
    if (invalidProducts.length > 0) {
      const invalidProductIds = invalidProducts.map(p => p._id);
      return res.status(400).json({ error: `Products with IDs ${invalidProductIds.join(', ')} are either inactive or do not belong to the seller.` });
    }

    // Check stock availability
    const outOfStockProducts = foundProducts.filter(product => {
      const productInBundle = products.find((p: { productId: string }) => p.productId.toString() === product._id.toString());
      return productInBundle && product.stock < productInBundle.quantity;
    });
    
    if (outOfStockProducts.length > 0) {
      const outOfStockProductIds = outOfStockProducts.map(p => p._id);
      return res.status(400).json({ error: `Products with IDs ${outOfStockProductIds.join(', ')} are out of stock.` });
    }

    // Calculate the total MRP of the bundle
    let totalMRP = 0;
    const bundleProducts = products.map((p: { productId: string, quantity: number }) => {
      const product = foundProducts.find(fp => fp._id.toString() === p.productId.toString());
      if (product) {
        totalMRP += product.MRP * p.quantity;
        return {
          productId: product._id,
          name: product.name, // Include product name
          MRP: product.MRP,
          quantity: p.quantity
        };
      }
      return null;
    }).filter((p: { productId: string; name: string; MRP: number; quantity: number } | null) => p !== null);

    // Apply seller discount
    const discountAmount = (totalMRP * sellerDiscount) / 100;
    const sellerDiscounted = totalMRP - discountAmount;
    
    // Create and save the bundle
    const bundle = new Bundle({
      name,
      description,
      products: bundleProducts, // Store the bundle products with details
      MRP: totalMRP, // Store the total MRP before discount
      sellerDiscount, // Store the discount percentage
      sellerDiscounted, // Store the final price after discount
      sellerId: userId,
      stock,
      isActive,
      isBlocked: false // Store the active status
    });

    console.log(products);
    
    await bundle.save();

    // Populate product details
    const populatedBundle = await Bundle.findById(bundle._id).populate('products').exec();

    res.status(201).json(populatedBundle);

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

    // Extract query parameters for pagination, search, and sorting
    const { page = 1, limit = 10, search = '' } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const pageSize = parseInt(limit as string, 10);
    
    // Ensure that pagination parameters are valid
    if (pageNumber < 1 || pageSize < 1) {
      return res.status(400).json({ message: 'Invalid pagination parameters' });
    }

    // Create regex pattern for searching by name
    const searchPattern = new RegExp(search as string, 'i');

    // Retrieve bundles with pagination, search, and sorting alphabetically by name
    const bundles = await Bundle.find({ 
      sellerId: userId, 
      name: { $regex: searchPattern }
    })
    .sort({ name: 1 }) // Sorting in ascending alphabetical order
    .skip((pageNumber - 1) * pageSize) // Skip items for pagination
    .limit(pageSize) // Limit items for pagination
    .exec();

    // Count total bundles for pagination
    const totalBundles = await Bundle.countDocuments({ 
      sellerId: userId, 
      name: { $regex: searchPattern }
    }).exec();

    // Prepare response with pagination metadata
    const response = {
      totalItems: totalBundles,
      totalPages: Math.ceil(totalBundles / pageSize),
      currentPage: pageNumber,
      itemsPerPage: pageSize,
      bundles
    };

    // Return the paginated, filtered, and sorted list of bundles
    res.status(200).json(response);

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
    const { name, description, products,stock, sellerDiscount, isActive } = req.body;

    // Validate required fields
    if (typeof name !== 'string' || typeof description !== 'string' || !Array.isArray(products)) {
      return res.status(400).json({ error: 'Required fields are missing or invalid' });
    }

     // Validate sellerDiscount
     if (sellerDiscount < 0 || sellerDiscount > 100) {
      return res.status(400).json({ error: 'sellerDiscount must be between 0 and 100' });
    }

    // Check if all products are active and calculate the total MRP
    const productIds = products.map((p: { productId: string }) => p.productId);
    const foundProducts = await Product.find({ _id: { $in: productIds } }).exec();

    
    const blockedProducts = foundProducts.filter(product => product.isBlocked);
    
    if (blockedProducts.length > 0) {
      const blockedProductIds = blockedProducts.map(p => p._id);
      return res.status(400).json({ error: `Products with IDs ${blockedProductIds.join(', ')} are blocked and cannot be included in the bundle.` });
    }
    
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
    
    if(sellerDiscount > 0){
    // Calculate the final price after applying the seller discount
    const discount = sellerDiscount || 0;
    const sellerDiscounted = totalMRP - (totalMRP * discount / 100);
    
    // console.log(finalPrice);

    // Update the bundle details
    bundle.name = name;
    bundle.description = description;
    bundle.stock = stock;
    bundle.products = products;
    if (typeof isActive === 'boolean') {
      bundle.isActive = isActive;
    }
    bundle.sellerDiscount = discount;
     bundle.sellerDiscounted = sellerDiscounted;
    bundle.MRP=totalMRP;
  }

  console.log(bundle.discountId);

   const discount = await Discount.findById(bundle.discountId);
  // const finalPrice1 =bundle.finalPrice;
  if(bundle.adminDiscountApplied && bundle.sellerDiscounted && discount && discount.type === "sellerDiscounted"  ){
    // const bundle = await Bundle.findById(id);
    
    // console.log(bundle);
    const discountAmount = (bundle.sellerDiscounted * bundle.adminDiscountApplied) / 100;
    const adminDiscountedPrice = bundle.sellerDiscounted - discountAmount;
    
    bundle.adminDiscountedPrice = adminDiscountedPrice;   
  }

  if(bundle.adminDiscountApplied && bundle.sellerDiscounted && discount && discount.type === "MRP"  ){
    // const bundle = await Bundle.findById(id);
    
    // console.log(bundle);
    const discountAmount = (bundle.MRP * bundle.adminDiscountApplied) / 100;
    const adminDiscountedPrice = bundle.MRP - discountAmount;
    
    bundle.adminDiscountedPrice = adminDiscountedPrice;   
  }
  
  
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
    bundle.isUnavailable = true;
    await bundle.save();

     // Remove the product from wishlists
    const wishlists = await Wishlist.find({ 'items.bundleId': id  }).exec();
    for (const wishlist of wishlists) {
      for (const item of wishlist.items) {
        if (item.productId?.toString() === id .toString()) {
          item.isUnavailable = true; // Mark the product as unavailable
        }
      }
      await wishlist.save();
    }

    // Remove the product from carts
    const carts = await Cart.find({ 'items.bundleId': id  }).exec();
    for (const cart of carts) {
      for (const item of cart.items) {
        if (item.productId?.toString() === id .toString()) {
          item.isUnavailable = true; // Mark the product as unavailable
        }
      }
      await cart.save();
    }

     // Remove the product from sale
     const sales = await Sale.find({ 'affectedProducts.productId': id  }).exec();
     for (const sale of sales) {
      for (const affectedProducts of sale.affectedProducts) {
        if (affectedProducts.productId?.toString() === id .toString()) {
          affectedProducts.isUnavailable = true; // Mark the product as unavailable
        }
      }
      await sale.save();
     }
 



    res.status(200).json({ message: 'Bundle has been soft deleted and removed from carts' });

  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unexpected error occurred.' });
    }
  }
};
