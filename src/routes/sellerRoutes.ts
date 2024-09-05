import { Router } from 'express';
import { createSeller, updateSellerProfile,getUserProfile} from '../controller/sellerController';
// import {getUserAndSellerData } from '../controller/getSeller';

import { checkSellerRole } from '../verifyToken/checkSellerRole';
import { authenticateToken } from '../verifyToken/verifyToken1';
// import {  getUserAndSellerData } from '../controller/getSeller';

const router = Router();

// Route to create or update seller profile using login token
router.post('/sellers/profile',authenticateToken ,checkSellerRole, createSeller);
router.put('/sellers/updateProfile',authenticateToken ,checkSellerRole, updateSellerProfile);
router.get('/get-seller',authenticateToken ,checkSellerRole, getUserProfile);

export default router;
