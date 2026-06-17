import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../error/app-error';
import { ApiResponse } from '../helper/api-response';
import * as authRepo from '../repositories/auth';
import { SignUpDto, SignInDto } from '../validators';

const JWT_SECRET: string | undefined = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('jwt secret not provided');

export async function signup(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        const body: SignUpDto = req.body;

        const salt: string = await bcrypt.genSalt(Number(process.env.BCRYPT_SALT_ROUNDS));
        const hash: string = await bcrypt.hash(body.password as string, salt);

        body.password = hash;

        await authRepo.createUser(body);

        return ApiResponse(res, 201, null, 'User account created successfully');
    } catch (error: any) {
        if (error.code == 'ER_DUP_ENTRY') return next(new AppError(409, 'Invalid Signup Request', 'Email already exist'));
        return next(error);
    }
}

export async function signin(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        const body: SignInDto = req.body;

        const user: authRepo.UserWithAddresses | undefined = await authRepo.findUserByEmail(body.email);

        if (!user) throw new AppError(401, 'Invalid Login Attempt (User Not Found)', 'Please Provide valid credentials');

        const matched: boolean = await bcrypt.compare(body.password as string, user.password as string);

        if (!matched) throw new AppError(401, 'Invalid Login Attempt', 'Please Provide valid credentials');

        const token: string = jwt.sign({ id: user.id } as TTokenData, JWT_SECRET!);

        return ApiResponse(res, 200, { ...user, token, password: undefined }, 'User signin successfully');
    } catch (error) {
        return next(error);
    }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        return ApiResponse(res, 200, { ...req.user, password: undefined }, "User's authentication data");
    } catch (error) {
        return next(error);
    }
}
