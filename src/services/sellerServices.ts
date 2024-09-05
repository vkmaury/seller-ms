import Seller from '../models/sellerModel';

export const findOrCreateSeller = async (
  email: string,
  role: string,
  updateData: {
    shopName?: string;
    shopDescription?: string;
    shopContactNumber?: string;
    businessLicense?: string;
    taxId?: string;
    website?: string;
  }
) => {
  let seller = await Seller.findOne({ email }).exec();

  if (seller) {
    // Update seller if it exists
    seller = await Seller.findByIdAndUpdate(seller._id, updateData, { new: true }).exec();
  } else {
    // Create new seller if it doesn't exist
    seller = new Seller({ email, role, ...updateData });
    await seller.save();
  }

  // Return the seller, ensuring it is not null
  return seller;
};
