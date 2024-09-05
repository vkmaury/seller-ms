import { Router } from 'express';
import { getSalesReportController,getTopSellingProductsController,getSalesAnalyticsController  } from '../controller/salesReport';
// import {getUserAndSellerData } from '../controller/getSeller';

import { checkSellerRole } from '../verifyToken/checkSellerRole';
import { authenticateToken } from '../verifyToken/verifyToken1';
// import {  getUserAndSellerData } from '../controller/getSeller';

const router = Router();

// Route to create or update seller profile using login token

router.get('/getSalesReport',authenticateToken ,checkSellerRole, getSalesReportController);
router.get('/topSelling',authenticateToken ,checkSellerRole, getTopSellingProductsController );
router.get('/salesAnalytics',authenticateToken ,checkSellerRole, getSalesAnalyticsController  );

export default router;
