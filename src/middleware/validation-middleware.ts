import { Request, Response, NextFunction, RequestHandler } from 'express';
import * as z from 'zod';
import { AppError } from '../error/app-error';

export function validate(schema: z.ZodSchema): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
        const body = JSON.parse(JSON.stringify(req.body));

        const result = schema.safeParse(body);

        if (!result.success) {
            const flattened = z.flattenError(result.error);
            return next(new AppError(400, 'Invalid Request Body', 'Please provide valid request body', flattened.fieldErrors));
        }

        req.body = result.data;
        req.originalRequestBody = body;

        return next();
    };
}
