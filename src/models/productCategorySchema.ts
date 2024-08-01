import { Schema, model, Document } from 'mongoose';

interface IProductCategory extends Document {
  
  name: string;
  category:string;
  description?: string;
}

const ProductCategorySchema = new Schema<IProductCategory>({

  name: { type: String, required: true, unique: true },
  category: { type: String, required: true},
  description: { type: String }
});

const ProductCategory = model<IProductCategory>('ProductCategory', ProductCategorySchema);
export default ProductCategory;
