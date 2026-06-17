import { Pool, ResultSetHeader /* RowDataPacket */ } from 'mysql2/promise';
import getPoolConnection from '../connection';
import { AppError } from '../error/app-error';

const pool: Pool = getPoolConnection();

export async function updateProfile(data: Pick<IUser, 'id' | 'username' | 'phone' | 'photo'>): Promise<boolean> {
    if (!data.id) throw new AppError(400, 'Invalid Update Profile Query', 'User id is not provided');

    const query = 'UPDATE users SET username = ?, phone = ?, photo = ? WHERE id = ?;';
    const [result] = await pool.execute<ResultSetHeader>(query, [data.username, data.phone, data.photo, data.id]);

    return result.affectedRows > 0;
}

export async function newAddress(data: Pick<IAddress, 'address' | 'type' | 'userId'>): Promise<number> {
    const query = 'INSERT INTO addresses (address, type, userId) VALUES (?, ?, ?);';
    const [result] = await pool.execute<ResultSetHeader>(query, [data.address, data.type, data.userId]);
    return result.insertId;
}

export async function defaultAddress(addressId: number, userId: number): Promise<boolean> {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        await connection.execute('UPDATE addresses SET isDefault = false WHERE userId = ?;', [userId]);

        const [result] = await connection.execute<ResultSetHeader>('UPDATE addresses SET isDefault = true WHERE id = ?;', [addressId]);

        await connection.commit();

        return result.affectedRows > 0;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

export async function deleteAddress(id: number): Promise<boolean> {
    const query = 'DELETE FROM addresses WHERE id = ? AND isDefault = FALSE;';
    const [result] = await pool.execute<ResultSetHeader>(query, [id]);
    return result.affectedRows > 0;
}

export async function updatePassword(hash: string, id: number): Promise<ResultSetHeader> {
    const query = 'UPDATE users SET password = ? WHERE id = ?;';
    const [result] = await pool.execute<ResultSetHeader>(query, [hash, id]);
    return result;
}
