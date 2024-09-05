import { Request, Response } from 'express';
import Order from '../models/orderSchema';
import User from '../models/User';
// import { IProduct } from '../models/productSchema';
import Product from '../models/productSchema'; // Adjust this import based on your product model path
import moment from 'moment-timezone';
import jwt from 'jsonwebtoken';

// Helper function to get the start and end dates based on the period
const getDateRange = (period: 'daily' | 'weekly' | 'monthly') => {
  const now = moment.tz('Asia/Kolkata'); // Using 'Asia/Kolkata' timezone
  let startDate: Date;
  let endDate: Date;

  switch (period) {
    case 'daily':
      startDate = now.startOf('day').toDate();
      endDate = now.endOf('day').toDate();
      break;
    case 'weekly':
      startDate = now.startOf('week').toDate();
      endDate = now.endOf('week').toDate();
      break;
    case 'monthly':
      startDate = now.startOf('month').toDate();
      endDate = now.endOf('month').toDate();
      break;
    default:
      throw new Error('Invalid period');
  }

  return { startDate, endDate };
};

const extractUserId = (req: Request): string | null => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return null;
  
    try {
      const decoded: any = jwt.verify(token, 'mysecretkey'); // Replace 'mysecretkey' with your actual key
      return decoded.id;
    } catch (error) {
      console.error('Token verification failed:', error); // Log the error for debugging
      return null;
    }
  };

export const getSalesReportController = async (req: Request, res: Response) => {
  try {
    const userId = extractUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if the user is active in auth-ms
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ message: 'Seller is not active' });
    }

    const { period = 'daily' } = req.query as { period?: 'daily' | 'weekly' | 'monthly' };

    // Validate period input
    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      return res.status(400).json({ message: 'Invalid period specified' });
    }

    const { startDate, endDate } = getDateRange(period);

    // Retrieve orders within the specified period
    const orders = await Order.find({
      orderStatus: 'Delivered', // Filter for delivered orders
      orderDate: { $gte: startDate, $lte: endDate }, // Filter by the date range
    });

    // Initialize data structures to collect sales information
    let totalSales = 0;
    let totalQuantity = 0;
    let totalOrders = 0;
    const productDetailsMap: { [productId: string]: { name: string; quantity: number; total: number } } = {};

    // Process orders to accumulate sales data
    for (const order of orders) {
      for (const item of order.items) {
        if (item.productId) { // Ensure the item has a productId
          // Find product details
          const product = await Product.findById(item.productId);
          if (product && product.userId.toString() === userId) {
            totalSales += item.total;
            totalQuantity += item.quantity;
            totalOrders += 1;

            if (!productDetailsMap[product._id.toString()]) {
              productDetailsMap[product._id.toString()] = { name: product.name, quantity: 0, total: 0 };
            }

            productDetailsMap[product._id.toString()].quantity += item.quantity;
            productDetailsMap[product._id.toString()].total += item.total;
          }
        }
      }
    }

    // Prepare product details for response
    const productDetails = Object.keys(productDetailsMap).map(productId => ({
      productId,
      name: productDetailsMap[productId].name,
      quantity: productDetailsMap[productId].quantity,
      total: productDetailsMap[productId].total,
    }));

    // Send the sales report to the client
    return res.status(200).json({
      period,
      totalSales,
      totalQuantity,
      totalOrders,
      productDetails,
    });
  } catch (error) {
    console.error('Error retrieving sales report:', error); // Log the error for debugging
    return res.status(500).json({ message: 'Error retrieving sales report', error });
  }
};

export const getTopSellingProductsController = async (req: Request, res: Response) => {
    try {
      // Extract seller ID from JWT token
      const userId = extractUserId(req);
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
  
      // Check if the user is active in auth-ms
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      if (!user.isActive) {
        return res.status(403).json({ message: 'Seller is not active' });
      }
  
      const { period = 'daily', limit = 5 } = req.query as { period?: 'daily' | 'weekly' | 'monthly', limit?: number };
  
      // Validate the period input
      if (!['daily', 'weekly', 'monthly'].includes(period)) {
        return res.status(400).json({ message: 'Invalid period specified' });
      }
  
      const { startDate, endDate } = getDateRange(period);
  
      // Fetch all orders in the specified date range for the seller
      const orders = await Order.find({
        orderStatus: 'Delivered',
        orderDate: { $gte: startDate, $lte: endDate },
      });
  
      // Initialize a map to store product sale data
      const productSalesMap: { [productId: string]: { productName: string; totalQuantitySold: number; totalSalesAmount: number } } = {};
  
      // Loop through each order and process the items
      for (const order of orders) {
        for (const item of order.items) {
          const product = await Product.findOne({ _id: item.productId, userId }); // Fetch the product for the seller
          if (product) {
            const productId = product._id.toString();
  
            if (!productSalesMap[productId]) {
              // Initialize the product data if not already present in the map
              productSalesMap[productId] = {
                productName: product.name,
                totalQuantitySold: 0,
                totalSalesAmount: 0,
              };
            }
  
            // Accumulate the total quantity sold and sales amount
            productSalesMap[productId].totalQuantitySold += item.quantity;
            productSalesMap[productId].totalSalesAmount += item.total;
          }
        }
      }
  
      // Convert the map into an array of product sales data
      const topProducts = Object.values(productSalesMap)
        .sort((a, b) => b.totalQuantitySold - a.totalQuantitySold) // Sort by total quantity sold in descending order
        .slice(0, Number(limit)); // Limit the number of products returned
  
      // Send the response with top-selling products
      return res.status(200).json({
        period,
        topProducts,
      });
    } catch (error) {
      console.error('Error retrieving top-selling products:', error); // Log the error for debugging
      return res.status(500).json({ message: 'Error retrieving top-selling products', error });
    }
  };

export const getSalesAnalyticsController = async (req: Request, res: Response) => {
    try {
      // Extract seller ID from JWT token
      const userId = extractUserId(req);
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
  
      // Check if the user is active in auth-ms (Optional, assuming user status check is implemented)
      const user = await User.findById(userId);
      if (!user || !user.isActive) {
        return res.status(403).json({ message: 'Seller is not active' });
      }
  
      // Extract query parameters
      const { period = 'daily' } = req.query as { period?: 'daily' | 'weekly' | 'monthly' };
  
      // Validate the period input
      if (!['daily', 'weekly', 'monthly'].includes(period)) {
        return res.status(400).json({ message: 'Invalid period specified' });
      }
  
      // Get start and end dates based on the selected period
      const { startDate, endDate } = getDateRange(period);
  
      // Fetch orders for the specified period
      const orders = await Order.find({
        orderStatus: 'Delivered', // Consider only delivered orders
        orderDate: { $gte: startDate, $lte: endDate }, // Filter by date range
      });
  
      // Fetch all products for the seller
      const products = await Product.find({ userId: userId });
  
      // Create a map of product IDs to products
      const productMap = new Map(products.map(product => [product._id.toString(), product]));
  
      // Calculate total sales and revenue manually
      let totalSales = 0;
      let totalRevenue = 0;
      const dailySales: { day: string; dailyTotal: number }[] = [];
  
      // Loop through orders to calculate totals and check if product belongs to the seller
      orders.forEach(order => {
        order.items.forEach(item => {
          const product = productMap.get(item.productId.toString());
  
          if (product) {
            // Increment total sales and total revenue for this seller's products
            totalSales += 1;
            totalRevenue += item.total;
  
            // Calculate daily sales
            const orderDay = order.orderDate?.toISOString().split('T')[0]; // Optional chaining for orderDate
            if (orderDay) {
              const existingDay = dailySales.find(sale => sale.day === orderDay);
  
              if (existingDay) {
                existingDay.dailyTotal += item.total;
              } else {
                dailySales.push({
                  day: orderDay,
                  dailyTotal: item.total,
                });
              }
            }
          }
        });
      });
  
      // Send the response with sales analytics
      return res.status(200).json({
        period,
        totalSales,
        totalRevenue,
        dailySales, // You can return daily sales data for graph plotting if needed
      });
    } catch (error) {
      console.error('Error retrieving sales analytics:', error);
      return res.status(500).json({ message: 'Error retrieving sales analytics', error });
    }
  };
  