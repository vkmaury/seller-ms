import mongoose, { Document, Schema, Types } from 'mongoose';

interface IProduct extends Document {
    _id: Types.ObjectId;
    name: string;
    description: string;
    MRP: number;
    finalePrice:number;
    stock: number;
    categoryId: Schema.Types.ObjectId; 
     
    userId: mongoose.Types.ObjectId;
    discountId: Schema.Types.ObjectId;
    isUnavailable:boolean,
    saleApplied: boolean,
    createdAt: Date;
    updatedAt: Date;
    sellerDiscountApplied?: number; 
    sellerDiscounted: number; // New field
    adminDiscountApplied?: number;
    adminDiscountedPrice?: number;
    // type: 'MRP' | 'sellerDiscounted'; // Added field
    isActive: boolean;
    isBlocked: boolean;
    
}

const productSchema: Schema = new Schema<IProduct>({
    name: { type: String, required: true },
    description: { type: String, required: true },
    MRP: { type: Number, required: true },
    finalePrice:{type: Number},
    isUnavailable:{ type: Boolean, default: false },
    saleApplied:{type: Boolean, default: false },
    stock: { type: Number, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'ProductCategory', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'Auth-ms'},
    discountId: { type: Schema.Types.ObjectId, ref: 'Discount'},
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    sellerDiscountApplied: { type: Number },
    sellerDiscounted: { type: Number }, // New field
    adminDiscountApplied: { type: Number},
    adminDiscountedPrice: { type: Number}, 
    // type: { type: String, enum: ['MRP', 'sellerDiscounted']}, // Added field
    isActive: { type: Boolean, default: true },
    isBlocked: { type: Boolean, default: false },
});

export default mongoose.model<IProduct>('product', productSchema);
