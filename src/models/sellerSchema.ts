import { Schema, model, Document } from 'mongoose';

interface ISeller extends Document {
  userId: Schema.Types.ObjectId;
  shopName: string;
  shopDescription?: string;
  shopContactNumber?: string;
  businessLicense?: string;
  taxId?: string;
  website?: string;
}

const SellerSchema = new Schema<ISeller>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  shopName: { type: String, required: true },
  shopDescription: { type: String },
  shopContactNumber: { type: String },
  businessLicense: { type: String },
  taxId: { type: String },
  website: { type: String },
});

const Seller = model<ISeller>('Seller', SellerSchema);
export default Seller;
