// import { Request, Response } from 'express';
// import Product from '../models/productSchema';
// import axios from 'axios';

// // Apply discount to a product
// export const applyDiscount = async (req: Request, res: Response) => {
//   try {
//     const { productId, discountCode } = req.body;

//     // Validate input
//     if (!productId || !discountCode) {
//       return res.status(400).json({ message: 'Product ID and discount code are required' });
//     }

//     // Fetch discount details from admin-ms with authorization
//     const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NmE3M2NmNzU4MTRjMzk1YmRhNzUwNmUiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MjIzNDA2ODgsImV4cCI6MTcyMjQyNzA4OH0.s9pMUqgMGfkG-YOr6M37Lp_diRKnn8M5xrNa_DvGNS8'; // Replace with your actual token
//     const discountResponse = await axios.get(`http://localhost:3004/api/v1/discounts1?discountCode=${discountCode}`, {
//       headers: {
//         'Authorization': `Bearer ${token}`
//       }
//     });
//     console.log(discountResponse);
//     const discount = discountResponse.data;

//     if (!discount || !discount.isActive) {
//       return res.status(404).json({ message: 'Discount not found or inactive' });
//     }

//     const product = await Product.findById(productId);

//     if (!product) {
//       return res.status(404).json({ message: 'Product not found' });
//     }

//     // Calculate discounted price
//     const discountedPrice = product.MRP * (1 - discount.percentage / 100);
//     product.discountCode = discountCode;
//     product.discountedPrice = discountedPrice;

//     await product.save();
//     res.status(200).json(product);
//   } catch (error) {
//     // Handle and log the error appropriately
//     if (axios.isAxiosError(error)) {
//       console.error('Axios error:', error.response?.data || error.message);
//       res.status(error.response?.status || 500).json({ 
//         message: error.response?.data?.message || 'Error fetching discount' 
//       });
//     } else if (error instanceof Error) {
//       console.error('Error:', error.message);
//       res.status(400).json({ message: error.message });
//     } else {
//       console.error('Unknown error:', error);
//       res.status(500).json({ message: 'An unknown error occurred' });
//     }
//   }
// };