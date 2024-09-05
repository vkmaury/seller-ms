import { Request, Response, NextFunction } from 'express';

export const checkSellerRole = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'seller') {
    return res.status(403).json({ message: 'Forbidden: Only sellers can perform this action.' });
  }
  next();
};
