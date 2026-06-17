import { Request, Response, NextFunction } from 'express';
import { AppError } from '../error/app-error';

export function AppErrorHandler(error: any, _req: Request, res: Response, _next: NextFunction): any {
    console.log(error);

    const timestamp: string = new Date().toISOString();

    if (error instanceof AppError) {
        const body = {
            success: false,
            statusCode: error.statusCode,
            payload: null,
            message: error.message,
            error: error?.error,
            // ...error.extraKeys,
            timestamp
        };
        return res.status(error.statusCode).json(body);
    }

    return res.status(500).json({ success: false, statusCode: 500, payload: null, message: 'something went wrong', timestamp });
}
