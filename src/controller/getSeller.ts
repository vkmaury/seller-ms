import { Request, Response } from 'express';
import User from '../models/User'; // Adjust the path as needed
import Seller from '../models/sellerModel'; // Adjust the path as needed

// Get user and seller data by user ID
export const getUserAndSellerData = async (req: Request, res: Response) => {
  const userId = req.query.userId as string; // Extract the ID from query parameters

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // Fetch user data
    const user = await User.findById(userId).exec();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch seller data if the user is a seller
    let seller = null;
    if (user.role === 'seller') {
      seller = await Seller.findOne({ userId }).exec();
    }

    // Respond with both user and seller data
    res.status(200).json({ user, seller });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
};
