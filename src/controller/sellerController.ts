import { Request, Response } from 'express';
import Seller from '../models/sellerModel';
import User from '../models/User'; // Adjust the path as needed

// Create a new seller
export const createSeller = async (req: Request, res: Response) => {
  try {
    // Ensure userId is provided in the request body
    
    const { userId, ...sellerData } = req.body;
    
    // Validate userId
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    // console.log(userId);
    // Check if the user exists
    const user = await User.findById(userId);
    console.log(user);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Create and save the seller
    const seller = new Seller({ ...sellerData, userId });
    await seller.save();
    res.status(201).json(seller);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
};

// Update a seller by ID
export const updateSeller = async (req: Request, res: Response) => {
  const sellerId = req.query.id as string; // Extract the ID from query parameters

  if (!sellerId) {
    return res.status(400).json({ error: 'Seller ID is required' });
  }

  try {
    const seller = await Seller.findById(sellerId).exec();

    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }
    
    // Update seller details
    const updatedSeller = await Seller.findByIdAndUpdate(sellerId, req.body, { new: true });
    res.status(200).json(updatedSeller);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
};

// Get a seller by ID
export const getSeller = async (req: Request, res: Response) => {
  const sellerId = req.query.id as string; // Extract the ID from query parameters

  if (!sellerId) {
    return res.status(400).json({ error: 'Seller ID is required' });
  }

  try {
    const seller = await Seller.findById(sellerId).exec();

    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    res.status(200).json(seller);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
};
