import { Request, Response } from 'express';
import Product from '../models/productSchema';
import Bundle from '../models/bundleSchema';
import Discount from '../models/discountModel';
import Wishlist from '../models/wishlistSchema'; // Import Wishlist model
import Cart from '../models/addToCartSchema'; // Import Cart model
import Sale from '../models/saleSchema'; // Import Cart model

// Helper function to calculate MRP for the bundle
const calculateBundleValues = async (products: any[]) => {
  let totalMRP = 0;

  // Use Promise.all to fetch MRP for all products concurrently
  await Promise.all(products.map(async (item) => {
    const product = await Product.findById(item.productId).exec();
    if (product && typeof product.MRP === 'number') {
      totalMRP += item.quantity * product.MRP;
    }
  }));

  return { totalMRP };
};

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

    // Perform soft delete
    product.isActive = false;
    product.isUnavailable = true; // Deactivate the product
    await product.save();

    // Remove the product from any bundles
    const bundles = await Bundle.find({ 'products.productId': productId }).exec();
    if (bundles.length > 0) {
      for (const bundle of bundles) {
        // Remove the product from the bundle's products array
        bundle.products = bundle.products.filter(p => p.productId.toString() !== productId.toString());

        // Calculate updated bundle values
        const { totalMRP } = await calculateBundleValues(bundle.products);
        const sellerDiscount = bundle.sellerDiscount ?? 0;
        let discountedPrice = totalMRP;

        if (sellerDiscount > 0) {
          // Apply seller discount
          const totalDiscount = (totalMRP * sellerDiscount) / 100;
          discountedPrice = totalMRP - totalDiscount;
          bundle.MRP = totalMRP;
          bundle.sellerDiscounted = discountedPrice;
        }

        if (bundle.discountId) {
          const discount = await Discount.findById(bundle.discountId).exec();
          if (discount) {
            if (discount.type === 'sellerDiscounted') {
              const adminDiscountApplied = bundle.adminDiscountApplied ?? 0;
              if (adminDiscountApplied > 0) {
                const discountAmount = (bundle.adminDiscountedPrice ?? discountedPrice) * adminDiscountApplied / 100;
                const adminDiscountedPrice = (bundle.adminDiscountedPrice ?? discountedPrice) - discountAmount;
                bundle.adminDiscountedPrice = adminDiscountedPrice;
              }
            }

            if (discount.type === 'MRP') {
              const adminDiscountApplied = bundle.adminDiscountApplied ?? 0;
              if (adminDiscountApplied > 0) {
                const discountAmount = (bundle.MRP * adminDiscountApplied / 100);
                const adminDiscountedPrice = bundle.MRP - discountAmount;
                bundle.adminDiscountedPrice = adminDiscountedPrice;
              }
            }
          }
        }

        // Apply admin discount if available
        const adminDiscount = bundle.adminDiscount ?? 0;
        if (adminDiscount > 0) {
          const discountAmount = (bundle.adminDiscountedPrice ?? discountedPrice) * adminDiscount / 100;
          bundle.adminDiscountedPrice = (bundle.adminDiscountedPrice ?? discountedPrice) - discountAmount;
        }

        await bundle.save();
      }
    }

   
   
    // Remove the product from wishlists
    const wishlists = await Wishlist.find({ 'items.productId': productId }).exec();
    for (const wishlist of wishlists) {
      for (const item of wishlist.items) {
        if (item.productId?.toString() === productId.toString()) {
          item.isUnavailable = true; // Mark the product as unavailable
        }
      }
      await wishlist.save();
    }

    // Remove the product from carts
    const carts = await Cart.find({ 'items.productId': productId }).exec();
    for (const cart of carts) {
      for (const item of cart.items) {
        if (item.productId?.toString() === productId.toString()) {
          item.isUnavailable = true; // Mark the product as unavailable
        }
      }
      await cart.save();
    }

     // Remove the product from sale
     const sales = await Sale.find({ 'affectedProducts.productId': productId }).exec();
     for (const sale of sales) {
      for (const affectedProducts of sale.affectedProducts) {
        if (affectedProducts.productId?.toString() === productId.toString()) {
          affectedProducts.isUnavailable = true; // Mark the product as unavailable
        }
      }
      await sale.save();
     }
 


    return res.status(200).json({ message: 'Product soft deleted successfully' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
};
