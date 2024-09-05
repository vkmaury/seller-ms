import { Request, Response } from 'express';
import ProductCategory from '../models/productCategorySchema'; // Adjust the import according to your project structure

export const getAllCategoriesController = async (req: Request, res: Response) => {
  try {
    const { search = '', sortBy = 'name', page = 1, limit = 10 } = req.query;

    // Convert pagination and limit parameters to appropriate types
    const pageNumber = parseInt(page as string, 10) || 1; // Default to page 1 if conversion fails
    const pageSize = parseInt(limit as string, 10) || 10; // Default to 10 items per page if conversion fails
    const sortField = (typeof sortBy === 'string' && sortBy) || 'name'; // Default to 'name' if conversion fails

    // Ensure sortField is a valid field
    const validSortFields: string[] = ['name', 'dateCreated', 'popularity']; // Adjust according to your schema
    const validSortField = validSortFields.includes(sortField) ? sortField : 'name';

    // Build the query object
    const query: any = {
      isActive: true,
      name: { $regex: search as string, $options: 'i' } // Example search by name
    };

    // Create sort object with a valid string key
    const sortObject: { [key: string]: 1 } = {
      [validSortField]: 1 // Always sort in ascending order
    };

    // Fetch the total count of matching categories
    const totalCategories = await ProductCategory.countDocuments(query);

    // Fetch categories with pagination, sorting, and searching
    const categories = await ProductCategory.find(query)
      .sort(sortObject)
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize);

    return res.status(200).json({
      message: 'Categories retrieved successfully',
      totalCategorieData: totalCategories,
      currentPage: pageNumber,
      TotalPages: Math.ceil(totalCategories / pageSize),
      categories,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to retrieve categories', error });
  }
};
