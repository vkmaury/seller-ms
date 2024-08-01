import mongoose, { Document, Schema } from 'mongoose';

interface IProduct extends Document {
    name: string;
    description: string;
    MRP: number;

    stock: number;
    categoryId: Schema.Types.ObjectId; 

    userId: mongoose.Types.ObjectId;
    

    createdAt: Date;
    updatedAt: Date;
    discount?: number; 
    sellerDiscounted?: number; // New field
    isActive: boolean;
    
}

const productSchema: Schema = new Schema<IProduct>({
    name: { type: String, required: true },
    description: { type: String, required: true },
    MRP: { type: Number, required: true },

    stock: { type: Number, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'ProductCategory', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'Auth-ms', required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    discount: { type: Number },
    sellerDiscounted: { type: Number }, // New field
    isActive: { type: Boolean}
});

export default mongoose.model<IProduct>('product', productSchema);
