import { Response } from 'express';

export function ApiResponse(res: Response, statusCode: number = 200, payload: any = [], message: string, keys?: Record<string, any>) {
    const timestamp: string = new Date().toISOString();

    return res.status(statusCode).json({
        success: true,
        statusCode,
        payload,
        message,
        timestamp,
        ...keys
    });
}
