import { Router } from 'express';
import {
  createBundle ,
  getBundleById,
  getAllBundles,
  updateBundle,
  softDeleteBundle
  
} from '../controller/bundleController';
import { checkSellerRole } from '../verifyToken/checkSellerRole';
import { authenticateToken } from '../verifyToken/verifyToken1';

const router = Router();

// Route to create a new bundle
router.post('/bundles',authenticateToken,checkSellerRole, createBundle);

// // Route to get a bundle by ID
router.get('/getBundles',authenticateToken,checkSellerRole, getBundleById);

// // Route to get all bundles for a specific seller
router.get('/getAllBundle',authenticateToken,checkSellerRole, getAllBundles);

// // Route to update a bundle
router.put('/updateBundle',authenticateToken,checkSellerRole, updateBundle);

// // Route to delete a bundle
router.delete('/softDelete',authenticateToken,checkSellerRole, softDeleteBundle);

export default router;
