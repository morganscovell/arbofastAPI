import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import getPoolConnection from '../connection';

const pool: Pool = getPoolConnection();

export interface UserWithAddresses extends IUser {
    addresses: IAddress[];
}

async function findUser(id: number | null, email?: string): Promise<UserWithAddresses | undefined> {
    if (!id && !email) throw new Error('id or email must be provided');

    const query = `SELECT
                    users.*, 
                    
                    addresses.id AS addressId,
                    addresses.address AS address,
                    addresses.type AS addressType,
                    addresses.isDefault AS addressIsDefault,
                    addresses.userId AS addressUserId
                    
                    FROM users
                    LEFT JOIN addresses
                        ON users.id = addresses.userId
                    WHERE ${id ? 'users.id' : 'users.email'} = ?;`;

    const [rows] = await pool.execute<RowDataPacket[]>(query, [id ?? email!]);

    if (!rows.length) return undefined;

    const firstRow = rows[0]!;

    const user: UserWithAddresses = {
        id: firstRow.id,
        username: firstRow.username,
        email: firstRow.email,
        password: firstRow.password,
        phone: firstRow.phone,
        photo: firstRow.photo,
        active: Boolean(firstRow.active),
        role: firstRow.role,
        createdAt: firstRow.createdAt,
        updatedAt: firstRow.updatedAt,
        addresses: []
    };

    for (const row of rows) {
        if (row.addressId) {
            user.addresses.push({
                id: row.addressId,
                address: row.address,
                type: row.addressType,
                isDefault: Boolean(row.addressIsDefault),
                userId: row.addressUserId
            });
        }
    }

    return user;
}

export const findUserById = async (id: number) => findUser(id);
export const findUserByEmail = async (email: string) => findUser(null, email);

export async function createUser(data: TSignup): Promise<number> {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [user] = await connection.execute<ResultSetHeader>('INSERT INTO users (username, email, password, phone) VALUES (?, ?, ?, ?);', [
            data.username,
            data.email,
            data.password,
            data.phone,
            data.address
        ]);

        await connection.execute<ResultSetHeader>('INSERT INTO addresses (address, type, isDefault, userId) VALUES (?, ?, ?, ?);', [data.address, 'Home', true, user.insertId]);

        await connection.commit();

        return user.insertId;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}
