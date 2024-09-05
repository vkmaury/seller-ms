import { Router } from 'express';

import { checkSellerRole } from '../verifyToken/checkSellerRole';
import { authenticateToken } from '../verifyToken/verifyToken1';
import {addProductToSale,removeProductFromSale,getSaleById, getAllSales  } from '../controller/saleController'



const router = Router();

router.post('/addProductToSale',authenticateToken ,checkSellerRole, addProductToSale);
router.delete('/removeProductFromSale',authenticateToken ,checkSellerRole, removeProductFromSale);
router.get('/getSaleById',authenticateToken ,checkSellerRole, getSaleById );
router.get('/getAllSale',authenticateToken ,checkSellerRole,  getAllSales  );



export default router;