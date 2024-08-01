import mongoose, { Schema, Document } from 'mongoose';

interface ISeller extends Document {
  userId: Schema.Types.ObjectId; // Reference to the user
  shopName?: string;
  shopDescription?: string;
  shopContactNumber?: string;
  businessLicense?: string;
  taxId?: string;
  website?: string;
  createdAt?: Date;
  updatedAt?: Date;

 
}

const SellerSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    shopName: { type: String },
    shopDescription: { type: String },
    shopContactNumber: { type: String },
    businessLicense: { type: String },
    taxId: { type: String },
    website: { type: String },
   
    
    
    

  },
  { timestamps: true }
);

const Seller = mongoose.models.Seller || mongoose.model<ISeller>('Seller', SellerSchema);

export default Seller;
