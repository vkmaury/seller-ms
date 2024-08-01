import { Schema, model, Document } from 'mongoose';

interface ISeller extends Document {
  userId: Schema.Types.ObjectId;
  storeName: string;
  storeDescription?: string;
  storeAddress?: string;
  products: Schema.Types.ObjectId[];
}

const SellerSchema = new Schema<ISeller>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  storeName: { type: String, required: true },
  storeDescription: { type: String },
  storeAddress: { type: String },
  products: [{ type: Schema.Types.ObjectId, ref: 'Product' }]
});

const Seller = model<ISeller>('Seller', SellerSchema);
export default Seller;
