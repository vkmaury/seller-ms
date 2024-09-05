import mongoose from 'mongoose';
import Discount from '../models/discountModel';  // Adjust path as needed

export const createDiscount = async (discountData: any) => {
  const discount = new Discount(discountData);
  return await discount.save();
};

export const getDiscountByProductId = async (productId: string) => {
  return await Discount.findOne({ productId }).exec();
};

export const updateDiscount = async (discountId: string, updateData: any) => {
  return await Discount.findByIdAndUpdate(discountId, updateData, { new: true }).exec();
};

export const deleteDiscount = async (discountId: string) => {
  return await Discount.findByIdAndDelete(discountId).exec();
};
