import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import admin from 'firebase-admin';
import { AppError } from '../error/app-error';
import { ApiResponse } from '../helper/api-response';
import getPoolConnection from '../connection';

const JWT_SECRET: string | undefined = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('jwt secret not provided');

const pool: Pool = getPoolConnection();

const serviceAccount = JSON.parse(fs.readFileSync(path.join(process.cwd() + '/src/firebase/service-account.json'), 'utf-8'));

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

export async function verifyToken(req: Request, res: Response, next: NextFunction): Promise<any> {
    const connection = await pool.getConnection();

    try {
        const authHeader: string | undefined = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) throw new AppError(401, 'Invalid Token Verification Attempt', 'No token provided.');

        const firebaseToken: string | undefined = authHeader.split('Bearer ')[1];
        if (!firebaseToken) throw new AppError(401, 'Invalid Token Verification Attempt', 'No token provided.');

        const decoded = await admin.auth().verifyIdToken(firebaseToken);

        const email = decoded.email;
        const providerUserId = decoded.uid;
        const provider = decoded.firebase?.sign_in_provider === 'google.com' ? 'GOOGLE' : decoded.firebase?.sign_in_provider === 'apple.com' ? 'APPLE' : null;

        if (!email || !provider) throw new AppError(400, 'Invalid OAuth data', 'Missing email or provider');

        await connection.beginTransaction();

        /* 1. FIND USER BY OAUTH ACCOUNT */

        const [OauthAccount] = await connection.execute<RowDataPacket[]>('SELECT userId FROM oauth_accounts WHERE provider = ? AND providerUserId = ?;', [
            provider,
            providerUserId
        ]);

        if (OauthAccount.length) {
            const [user] = await connection.execute<RowDataPacket[]>('SELECT * FROM users WHERE id = ? LIMIT 1;', [OauthAccount[0]!.userId]);
            await connection.commit();
            const token: string = jwt.sign({ id: user[0]!.id } as TTokenData, JWT_SECRET!);
            return ApiResponse(res, 200, { ...user[0], addresses: [], token, password: undefined }, 'User signin successfully.');
        }

        /* 2. TRY EMAIL MATCH */

        const [user]: [RowDataPacket[], any] = await connection.execute('SELECT * FROM users WHERE email = ? LIMIT 1;', [email]);

        /* 3. LINK OAUTH ACCOUNT TO EXISTING USER */

        if (user.length) {
            await connection.execute<ResultSetHeader>('INSERT INTO oauth_accounts (userId, provider, providerUserId) VALUES (?, ?, ?)', [user[0]!.id, provider, providerUserId]);
            await connection.commit();
            const token: string = jwt.sign({ id: user[0]!.id } as TTokenData, JWT_SECRET!);
            return ApiResponse(res, 200, { ...user[0], addresses: [], token, password: undefined }, 'User signin successfully.');
        }

        /* 4. CREATE NEW USER AND IT'S OAUTH ACCOUNT */

        const username: string = decoded.name || email.split('@')[0];
        const photo: string | null = decoded.picture || null;

        const [userInsertResult] = await connection.execute<ResultSetHeader>('INSERT INTO users (username, email, photo) VALUES (?, ?, ?);', [username, email, photo]);

        await connection.execute('INSERT INTO oauth_accounts (userId, provider, providerUserId) VALUES (?, ?, ?);', [userInsertResult.insertId, provider, providerUserId]);

        const [newUser]: [RowDataPacket[], any] = await connection.execute('SELECT * FROM users WHERE id = ? ;', [userInsertResult.insertId]);

        await connection.commit();

        const token: string = jwt.sign({ id: newUser[0]!.id } as TTokenData, JWT_SECRET!);
        return ApiResponse(res, 200, { ...newUser[0], addresses: [], token, password: undefined }, 'User signin successfully.');
    } catch (error) {
        await connection.rollback();
        return next(error);
    } finally {
        connection.release();
    }
}
