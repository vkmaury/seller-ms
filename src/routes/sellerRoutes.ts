import { Router } from 'express';
import { createSeller, updateSeller} from '../controller/sellerController';
import { checkSellerRole } from '../verifyToken/checkSellerRole';
import { authenticateToken } from '../verifyToken/verifyToken1';
import {  getUserAndSellerData } from '../controller/getSeller';

const router = Router();

// Route to create or update seller profile using login token
router.post('/sellers/profile',authenticateToken ,checkSellerRole, createSeller);
router.put('/sellers/updateProfile',authenticateToken ,checkSellerRole, updateSeller);
// router.get('/sellers/getProfile',authenticateToken ,checkSellerRole,getSeller );

router.get('/get-seller',authenticateToken ,checkSellerRole, getUserAndSellerData);

export default router;
