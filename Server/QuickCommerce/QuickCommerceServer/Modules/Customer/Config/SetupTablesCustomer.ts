import mysql, { Connection, RowDataPacket } from 'mysql2/promise'
import { MYSQL_DATABASE, MYSQL_HOST, MYSQL_PASSWORD, MYSQL_USER } from '../../StandardConfig/SettingsReader';

export async function setUpCustomerDatabase(): Promise<void> {
    let connection: Connection | undefined;
    try {
        connection = await mysql.createConnection({
            host: MYSQL_HOST,
            user: MYSQL_USER,
            password: MYSQL_PASSWORD
        })
        const [dbResult]: any = await connection.query(
            `CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\`;`
        );
        if (dbResult.warningStatus === 0) {
            console.log(`Database '${MYSQL_DATABASE}' created.`);
        } else {
            console.log(`Using existing database '${MYSQL_DATABASE}'.`);
        }

        // Switch to the database
        await connection.query(`USE \`${MYSQL_DATABASE}\`;`);

        await createCustomerTable(connection);
    } catch (err) {
        throw err;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

async function createCustomerTable(connection: Connection) {
    const [tableResult] = await connection.query(`
    CREATE TABLE IF NOT EXISTS customer (
        customer_id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        status VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
    const [rows] = await connection.query<RowDataPacket[]>(`
       SELECT 1 FROM customer LIMIT 1;
      `);
    if (rows.length >=0) {
        console.log("customer table created");
    }
}


