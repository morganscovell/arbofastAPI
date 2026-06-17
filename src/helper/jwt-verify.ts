import jwt, { JsonWebTokenError, TokenExpiredError, NotBeforeError } from 'jsonwebtoken';

interface ITokenVerificationResult {
    valid: boolean;
    expired: boolean;
    message?: string;
    decoded?: TTokenData;
}

export function verifyToken(token: string): ITokenVerificationResult {
    try {
        const JWT_SECRET: string | undefined = process.env.JWT_SECRET;
        if (!JWT_SECRET) throw new Error('jwt secret not provided');
        const decoded: TTokenData = jwt.verify(token, JWT_SECRET as string) as TTokenData;
        return { valid: true, expired: false, decoded };
    } catch (error) {
        if (error instanceof TokenExpiredError) return { valid: false, expired: true, message: 'Token has expired' };
        if (error instanceof JsonWebTokenError) return { valid: false, expired: false, message: 'Invalid token' };
        if (error instanceof NotBeforeError) return { valid: false, expired: false, message: 'Token not active yet' };
        return { valid: false, expired: false, message: 'Token verification failed' };
    }
}
