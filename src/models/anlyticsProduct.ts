import { Schema, model, Document } from 'mongoose';

interface ISales extends Document {
  productId: Schema.Types.ObjectId;
  quantity: number;
  totalPrice: number;
  saleDate: Date;
}

const SalesSchema = new Schema<ISales>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  saleDate: { type: Date, default: Date.now }
});

const Sales = model<ISales>('Sales', SalesSchema);
export default Sales;
