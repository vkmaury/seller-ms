import { Request, Response } from 'express';
import Product from '../models/productSchema';
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

export const getAllProductsController = async (req: Request, res: Response) => {
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

    // Extract query parameters for pagination and searching
    const { page = 1, limit = 10, search = '' } = req.query;

    // Convert query parameters to appropriate types
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    // Build query filter
    const filter: any = {
      userId: userId,  // Ensure only products belonging to the logged-in user are fetched
      isActive: true
    };
    if (search) {
      filter.name = new RegExp(search as string, 'i'); // Case-insensitive search by name
    }

    // Fetch products with pagination, sorting by name (ascending), and filtering
    const products = await Product.find(filter)
      .sort({ name: 1 }) // Sort by name in ascending order
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .populate('categoryId')
      .exec();

    // Get the total count of products matching the filter
    const totalCount = await Product.countDocuments(filter).exec();

    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Send a success response with product details and pagination information
    res.status(200).json({
      total: totalCount,
      page: pageNumber,
      limit: limitNumber,
      products
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unexpected error occurred.' });
    }
  }
};
