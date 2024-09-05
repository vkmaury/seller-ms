import { Router } from 'express';
import {
    addProduct,
    
} from '../controller/addProduct';
import {
    getAllProductsController,
    
} from '../controller/getAllProducts';
import {
    getProductById,
    
} from '../controller/getProduct';
import {
    updateProduct,
    
} from '../controller/updateProduct';
import {
    softDeleteProduct,
    
} from '../controller/deleteProduct';
import { checkSellerRole } from '../verifyToken/checkSellerRole';
import { authenticateToken } from '../verifyToken/verifyToken1';
// import { applyDiscount } from '../controller/applyDiscount';

const router = Router();

router.post('/products', authenticateToken,checkSellerRole, addProduct);
router.get('/getAllProducts', authenticateToken ,checkSellerRole, getAllProductsController);
router.get('/getProducts', authenticateToken ,checkSellerRole, getProductById);
router.put('/updateProducts', authenticateToken ,checkSellerRole,updateProduct);
router.delete('/softDeletedProducts', authenticateToken ,checkSellerRole, softDeleteProduct);
// router.post('/apply-discount',authenticateToken ,checkSellerRole, applyDiscount);




export default router;
