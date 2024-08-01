import { Schema, model, Document } from 'mongoose';

// Define the interface for the Discount document
export interface IDiscount extends Document {
  code: string;
  percentage: number;
  isActive: boolean;
}

// Create the schema for Discount
const discountSchema = new Schema<IDiscount>({
  code: { type: String, required: true, unique: true },
  percentage: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
});

// Export the model
export default model<IDiscount>('Discount', discountSchema);
