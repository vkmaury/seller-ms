import { Router } from 'express';

import { checkSellerRole } from '../verifyToken/checkSellerRole';
import { authenticateToken } from '../verifyToken/verifyToken1';
import {getCategoryByIdController} from '../controller/getCategory'
import { getAllCategoriesController} from '../controller/getAllCategory'


const router = Router();

router.get('/get-category',authenticateToken ,checkSellerRole, getCategoryByIdController);
router.get('/get-all-category',authenticateToken ,checkSellerRole, getAllCategoriesController);

export default router;