import { Request, Response, NextFunction } from 'express';
import { AppError } from '../error/app-error';
import { verifyToken } from '../helper/jwt-verify';
import * as authRepo from '../repositories/auth';

export async function authentication(req: Request, res: Response, next: NextFunction) {
    try {
        const authorization = req.headers.authorization;
        if (!authorization) throw new AppError(401, 'Unauthorized User', 'User is unauthorized');

        const token = authorization.replace('Bearer ', '');
        if (!token) throw new AppError(401, 'Unauthorized User', 'User is unauthorized');

        const result = verifyToken(token);

        if (!result.valid) throw new AppError(401, 'Unauthorized User', 'User is unauthorized');

        const user: IUser | undefined = await authRepo.findUserById(result.decoded?.id as number);

        if (!user) throw new AppError(401, 'Invalid authorization Attempt (Valid Token)', 'User is unauthorized');

        req.user = { ...user, token } as IAuthenticatedUser;

        return next();
    } catch (error) {
        return next(error);
    }
}
