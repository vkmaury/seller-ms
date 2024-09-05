import { Request, Response } from 'express';
import Seller from '../models/sellerSchema'; // Adjust the import according to your project structure
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

// Get a seller by ID and combine with user data
export const getUserAndSellerData = async (req: Request, res: Response) => {
  const sellerId = req.query.id as string; // Extract the ID from query parameters

  if (!sellerId) {
    return res.status(400).json({ error: 'Seller ID is required' });
  }

  try {
    // Extract userId from token
    const userId = extractUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch seller data
    const seller = await Seller.findById(sellerId).exec();

    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    // Fetch user data from auth-ms
    const user = await User.findById(userId).exec();
    console.log(user);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (seller.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Combine seller data and user data
    const combinedData = {
      seller,
      user
    };

    res.status(200).json(combinedData);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
};
