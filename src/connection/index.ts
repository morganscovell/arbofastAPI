import mysql, { Pool, PoolOptions } from 'mysql2/promise';

let instantiated: boolean = false;
let pool: Pool;

export default function () {
    if (!instantiated) {
        pool = mysql.createPool({
            host: process.env.DB_HOST as string,
            port: Number(process.env.DB_PORT),
            user: process.env.DB_USER as string,
            password: process.env.DB_PASSWORD as string,
            database: process.env.DB_DATABASE as string,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 1000,
            timezone: 'Z',
            // multipleStatements: true,
            dateStrings: ['DATE', 'DATETIME', 'TIMESTAMP']
        } as PoolOptions);

        instantiated = true;
    }

    return pool;
}
