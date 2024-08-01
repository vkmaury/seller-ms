import Bundle from '../models/bundleSchema';
import Product from '../models/productSchema'; 
import { SortOrder } from 'mongoose';


export const createBundle = async (bundleData: any) => {
  const productData = bundleData.products; // Assume products is an array of objects with productId and quantity

  // Retrieve products and their prices
  const products = await Product.find({ _id: { $in: productData.map((p: { productId: any; }) => p.productId) } }).exec();
  
  if (products.length !== productData.length) {
    throw new Error('Some products not found');
  }

  // Calculate the total price of the bundle
  const totalPrice = products.reduce((sum, product) => {
    const quantity = productData.find((p: { productId: { toString: () => any; }; }) => p.productId.toString() === product.id.toString())?.quantity || 0;
    return sum + (product.MRP * quantity);
  }, 0);

  // Create the bundle with the calculated price
  const bundle = new Bundle({
    ...bundleData,
    price: totalPrice
  });

  return await bundle.save();
};

export const getBundleById = async (bundleId: string) => {
  return await Bundle.findById(bundleId).populate('products._id');
};

export const getBundlesBySellerId = async (
  sellerId: string,
  search?: string ,
  sortField: string = 'name',
  sortOrder:  'asc' | 'desc' = 'asc',
  page: number = 1,
  limit:number = 10
) => {
  try {
    // Build the query
    const filter: any = { sellerId };

    if (search) {
      filter.name = { $regex: search, $options: 'i' }; // Case-insensitive search by name
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Sorting
    const sort: { [key: string]: SortOrder } = { [sortField]: sortOrder === 'asc' ? 1 : -1 };

    // Fetch bundles
    const totalCount = await Bundle.countDocuments(filter);
    const bundles = await Bundle.find(filter)
      .sort(sort) // Correctly pass the sort object
      .skip(skip)
      .limit(limit);

    // Calculate pagination details
    const totalPages = Math.ceil(totalCount / limit);
    const currentPage = page;

    return {
      bundles,
      totalPages,
      perPage: limit,
      currentPage,
      totalCount
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('An unexpected error occurred.');
    }
  }
};
export const updateBundle = async (bundleId: string, updateData: any) => {
  return await Bundle.findByIdAndUpdate(bundleId, updateData, { new: true });
};

export const deleteBundle = async (bundleId: string) => {
  return await Bundle.findByIdAndDelete(bundleId);
};
