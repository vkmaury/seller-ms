import mongoose, { Schema, Document } from 'mongoose';


interface IProductDetail {
  productId: Schema.Types.ObjectId;
  name: string;
  MRP: number;
  quantity: number;
}


interface IBundle extends Document {
  name: string;
  description?: string; // Add description field
  products: IProductDetail[];
  MRP: number;
  sellerDiscount?: number; // Add this field
  adminDiscountApplied?: number;
  adminDiscountedPrice?: number;
  sellerDiscounted?: number; // Add this field for the final price after discount
  sellerId: string;
  adminDiscount?: number;
  stock: number;
  discountId: Schema.Types.ObjectId;
  isActive: boolean;
  isBlocked: boolean; // Add this field
  isUnavailable: boolean;
  AdminId?: Schema.Types.ObjectId; // Add this line to the interface
  createdAt: Date;
  updatedAt: Date;
}

const productDetailSchema = new Schema<IProductDetail>({
  productId: { type: Schema.Types.ObjectId, required: true, ref: 'Product' },
  name: { type: String },
  MRP: { type: Number },
  quantity: { type: Number, required: true }
});

const BundleSchema: Schema = new Schema(
  {
    name: { type: String},
    description: { type: String,required: true  }, 
    products: { type: [productDetailSchema], required: true },
    isUnavailable:{ type: Boolean, default: false },
    MRP: { type: Number},
    sellerDiscount: { type: Number}, 
    adminDiscount: { type: Number}, 
    stock: { type: Number},
    discountId: { type: Schema.Types.ObjectId, ref: 'Discount'},
    adminDiscountApplied: { type: Number},
    adminDiscountedPrice: { type: Number}, // Add this field with default value
    sellerDiscounted: { type: Number }, // Add this field for final price
    sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true },
    isActive: { type: Boolean, default: true },
    isBlocked: { type: Boolean, default: false },
    AdminId: { type: Schema.Types.ObjectId, ref: 'Admin' }, 
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model<IBundle>('Bundle', BundleSchema);
