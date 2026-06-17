import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import getPoolConnection from '../connection';

const pool: Pool = getPoolConnection();

interface PaginatedMulchRequests {
    data: IMulchRequest[];
    total: number;
}

export async function getAll(page: number = 1, limit: number = 10): Promise<PaginatedMulchRequests> {
    const offset: number = (page - 1) * limit;

    const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM mulch_requests LIMIT ${limit} OFFSET ${offset};`);

    const [countRows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM mulch_requests;');

    const total = Number(countRows[0]!.total);

    return { data: rows as IMulchRequest[], total };
}

export async function getUserAllRequest(id: number, page: number = 1, limit: number = 10): Promise<PaginatedMulchRequests> {
    const offset: number = (page - 1) * limit;

    const [rows] = await pool.execute<RowDataPacket[]>(`SELECT * FROM mulch_requests WHERE userId = ? LIMIT ${limit} OFFSET ${offset};`, [id]);

    const [countRows] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as total FROM mulch_requests WHERE userId = ?;', [id]);

    const total = Number(countRows[0]!.total);

    return { data: rows as IMulchRequest[], total };
}

export async function getById(id: number): Promise<IMulchRequest | undefined> {
    const [rows] = await pool.execute<RowDataPacket[]>(`SELECT * FROM mulch_requests WHERE id = ?`, [id]);
    return rows[0] as IMulchRequest | undefined;
}

export async function create(data: IMulchRequest): Promise<number> {
    const query = `INSERT INTO mulch_requests (amountPreference, username, phone, address, latitude, longitude, photoUrl, instruction, userId)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`;

    const [result] = await pool.execute<ResultSetHeader>(query, [
        data.amountPreference,
        data.username,
        data.phone,
        data.address,
        data.latitude,
        data.longitude,
        data.photoUrl,
        data.instruction ?? null,
        data.userId
    ]);

    return result.insertId;
}

export async function update(data: IMulchRequest): Promise<boolean> {
    if (!data.id) throw new Error('request id is not provided.');

    const query = `UPDATE mulch_requests SET
                    amountPreference = ?, username = ?, phone = ?, address = ?, latitude = ?, longitude = ?,
                    photoUrl = ?, instruction = ? WHERE id = ?;`;

    const [result] = await pool.execute<ResultSetHeader>(query, [
        data.amountPreference,
        data.username,
        data.phone,
        data.address,
        data.latitude,
        data.longitude,
        data.photoUrl,
        data.instruction ?? null,
        data.id
    ]);

    return result.affectedRows > 0;
}

export async function updateStatus(id: number, status: MulchRequestStatus): Promise<boolean> {
    const query = 'UPDATE mulch_requests SET status = ? WHERE id = ?;';
    const [result] = await pool.execute<ResultSetHeader>(query, [status, id]);
    return result.affectedRows > 0;
}

export async function deleteRequest(id: number): Promise<boolean> {
    const query = `DELETE FROM mulch_requests WHERE id = ?;`;
    const [result] = await pool.execute<ResultSetHeader>(query, [id]);
    return result.affectedRows > 0;
}
