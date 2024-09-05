import Product from '../models/productSchema';
import ProductModel from '../models/productSchema';



export const createProduct = async (productData: any) => {
  try {
    // Validate productData here if needed
    const product = new ProductModel(productData);
    const savedProduct = await product.save();
    return savedProduct;
  } catch (error) {
    // Log detailed error information
    console.error('Error creating product:', error);
    throw new Error("Failed to create product:");
  }
};


export const getProductsBySellerId = async (
  sellerId: string,
  searchName?: string,
  sortField: string = 'name',
  sortOrder: 'asc' | 'desc' = 'asc',
  page: number = 1,
  limit: number = 10
) => {
  try {
    // Create a filter object
    const filter: any = { sellerId };
    
    // Add name filter if provided
    if (searchName) {
      filter.name = { $regex: searchName, $options: 'i' }; // Case-insensitive search
    }
    
    // Determine sort order
    const sortOrderValue = sortOrder === 'asc' ;

    // Calculate total count of products
    const totalCount = await Product.countDocuments(filter);

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch products with filtering, sorting, and pagination
    const products = await Product.find(filter)
      .sort({ [sortField]: sortOrder === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    return {
      products,
      totalPages,
      perPage: limit,
      currentPage: page,
      totalCount
    };
  } catch (error) {
    throw new Error('Error fetching products: ');
  }
};



export const updateProduct = async (id: string, updateData: any) => {
    return await Product.findByIdAndUpdate(id, updateData, { new: true });
};

export const deleteProduct = async (id: string) => {
    return await Product.findByIdAndDelete(id);
};


