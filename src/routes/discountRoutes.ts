// import { Router } from 'express';
// import {
//   createDiscountController,

//   updateDiscountController,
//   deleteDiscountController
// } from '../controller/discountController';
// import { checkSellerRole } from '../verifyToken/checkSellerRole';
// import { authenticateToken } from '../verifyToken/verifyToken1';

// const router = Router();

// // Route to create a discount
// router.post('/discounts',authenticateToken,checkSellerRole, createDiscountController);

// // Route to get discounts by product ID
// // router.get('/discounts/:productId',authenticateToken,checkSellerRole, getDiscountByProductIdController);

// // Route to update a discount
// router.put('/discounts',authenticateToken,checkSellerRole, updateDiscountController);

// // Route to delete a discount
// router.delete('/discounts',authenticateToken,checkSellerRole, deleteDiscountController);

// export default router;
