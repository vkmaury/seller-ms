import { Request, Response } from 'express';
import Seller from '../models/sellerSchema';
import User from '../models/User'; // Adjust the path as needed

import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongoose'; // Import ObjectId

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

export const createSeller = async (req: Request, res: Response) => {
  try {
    // Extract userId from token
    const userId = extractUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the user is already a seller
    if (user.sellerId) {
      return res.status(400).json({ error: 'seller Profile is already created' });
    }

    // Extract other seller data from the request body
    const { shopName, shopDescription, shopContactNumber, businessLicense, taxId, website } = req.body;

    // Create and save the seller
    const seller = new Seller({
      userId,
      shopName,
      shopDescription,
      shopContactNumber,
      businessLicense,
      taxId,
      website,
    });

    const savedSeller = await seller.save();

    // Update the user with the sellerId, casting _id to ObjectId
    user.sellerId = savedSeller._id as ObjectId;
    await user.save();

    res.status(201).json({ message: 'Seller profile created successfully', seller: savedSeller });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
};


export const updateSellerProfile = async (req: Request, res: Response) => {
  try {
    // Extract userId from token
    const userId = extractUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // const { sellerId } = req.body; // Assuming `userId` is passed in the request body

    // const sellerId = user.sellerId;
    // console.log(sellerId);
    const { shopName,  shopDescription, shopContactNumber,businessLicense,taxId,website } = req.body;

    // Find the seller by userId
    const seller = await Seller.findOne( user.sellerId );
    console.log(seller);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Update seller profile fields
    seller.shopName = shopName || seller.shopName;
    seller.shopDescription = shopDescription || seller.shopDescription;
    seller.shopContactNumber = shopContactNumber || seller.shopContactNumber;
    seller.businessLicense = businessLicense || seller.businessLicense;
    seller.taxId = taxId || seller.taxId;
    seller.website = website || seller.website;

    // Save the updated seller profile
    await seller.save();

    return res.status(200).json({ message: 'Seller profile updated successfully', seller });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error });
  }
};


export const getUserProfile = async (req: Request, res: Response) => {
  try {
    // Extract userId from token
    const userId = extractUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find the user and populate the seller field
    const user = await User.findById(userId)
    // .populate('sellerId') // Populate category details
    // .exec();

    console.log(user);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const seller = await Seller.findOne( user.sellerId );
    
    res.status(200).json({ user,seller });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
};
