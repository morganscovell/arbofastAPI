import bcrypt from 'bcryptjs';
import { Pool, ResultSetHeader } from 'mysql2/promise';
import getPoolConnection from './connection';

const pool: Pool = getPoolConnection();

const admin = {
    username: process.env.ADMIN_USERNAME,
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD
};

async function seed() {
    if (!admin.username || !admin.email || !admin.password) throw new Error('Seed failed: admin.username, admin.email, and admin.password are required');

    const salt: string = await bcrypt.genSalt(Number(process.env.BCRYPT_SALT_ROUNDS));
    const hash: string = await bcrypt.hash(admin.password as string, salt);

    const data = [admin.username, admin.email, hash];

    const query = `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, "ADMIN");`;
    await pool.execute<ResultSetHeader>(query, data);
}

seed()
    .then(() => console.log('database seed successfully'))
    .catch((error) => console.log('SEED ERROR:', error))
    .finally(async () => await pool.end());
