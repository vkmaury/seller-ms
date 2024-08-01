import mongoose, { Schema, Document } from 'mongoose';

interface IBundle extends Document {
  name: string;
  description?: string; // Add description field
  products: { productId: string; quantity: number }[];
  MRP: number;
  sellerDiscount?: number; // Add this field
  finalPrice?: number; // Add this field for the final price after discount
  sellerId: string;
  isActive: boolean; // Add this field
  
  createdAt: Date;
  updatedAt: Date;
}

const BundleSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String,required: true  }, 
    products: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true }
      }
    ],
    MRP: { type: Number, required: true },
    sellerDiscount: { type: Number, default: 0 }, // Add this field with default value
    finalPrice: { type: Number }, // Add this field for final price
    sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model<IBundle>('Bundle', BundleSchema);
