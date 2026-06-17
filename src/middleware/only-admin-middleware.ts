import { Request, Response, NextFunction } from 'express';
import { AppError } from '../error/app-error';

export function onlyAdminRoute(req: Request, res: Response, next: NextFunction): any {
    if (req.user?.role != 'ADMIN') return next(new AppError(403, 'Unauthorized Access', 'User is unauthorized'));
    return next();
}
