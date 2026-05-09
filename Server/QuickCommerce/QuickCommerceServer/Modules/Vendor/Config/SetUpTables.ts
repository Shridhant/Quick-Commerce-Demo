import mysql, { Connection, RowDataPacket } from 'mysql2/promise'
import { MYSQL_DATABASE, MYSQL_HOST, MYSQL_PASSWORD, MYSQL_USER } from '../../StandardConfig/SettingsReader';

export async function setUpDatabase(): Promise<void> {
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

        await createVendorsTable(connection);
        await createOtpTable(connection);
        await createVendorWarehouseTable(connection);
        await createVendorServiceRequestTable(connection);
        await createVendorServiceRequestAttachmentTable(connection);
    } catch (err) {
        throw err;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

async function createVendorsTable(connection: Connection) {
    const [tableResult] = await connection.query(`
    CREATE TABLE IF NOT EXISTS vendors (
      vendor_id VARCHAR(100) NOT NULL,
      vendor_type ENUM('SELF_REGISTERED','ADMIN_CREATED') DEFAULT 'SELF_REGISTERED',
      created_by VARCHAR(100) DEFAULT NULL,
      is_company_vendor TINYINT(1) DEFAULT '0',
      business_owner_name VARCHAR(255) DEFAULT NULL,
      name VARCHAR(255) DEFAULT NULL,
      password VARCHAR(255) DEFAULT NULL,
      email VARCHAR(255) DEFAULT NULL,
      phone VARCHAR(20) DEFAULT NULL,
      address_line1 VARCHAR(255) DEFAULT NULL,
      address_line2 VARCHAR(255) DEFAULT NULL,
      city VARCHAR(100) DEFAULT NULL,
      state VARCHAR(100) DEFAULT NULL,
      postal_code VARCHAR(20) DEFAULT NULL,
      latitude FLOAT DEFAULT NULL,
      longitude FLOAT DEFAULT NULL,
      status VARCHAR(50) DEFAULT NULL,
      country VARCHAR(100) DEFAULT NULL,
      isActive TINYINT(1) DEFAULT '0',
      isDocumentUploaded TINYINT(1) DEFAULT '0',
      isDocumentVerified TINYINT(1) DEFAULT '0',
      gstId VARCHAR(50) DEFAULT NULL,
      gstFile VARCHAR(255) DEFAULT NULL,
      tradeLicenseFile VARCHAR(255) DEFAULT NULL,
      store_image VARCHAR(255) DEFAULT NULL,
      remarks TEXT,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (vendor_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);
    const [rows] = await connection.query<RowDataPacket[]>(`
       SELECT 1 FROM vendors LIMIT 1;
      `);
    if (rows.length >=1) {
        console.log("vendor table created");
    }
}

async function createOtpTable(connection: Connection) {
    const [tableResult] = await connection.query(`
   CREATE TABLE IF NOT EXISTS otps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    otp VARCHAR(10) NOT NULL,
    expires_at DATETIME NOT NULL
);
  `);
    const [rows] = await connection.query<RowDataPacket[]>(`
       SELECT 1 FROM otps LIMIT 1;
      `);
    if (rows.length >=1) {
        console.log("otps table created");
    }
}

async function createVendorWarehouseTable(connection: Connection) {
    const [tableResult] = await connection.query(`
   CREATE TABLE IF NOT EXISTS vendor_warehouses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id VARCHAR(100),
    warehouse_id VARCHAR(100),
    status VARCHAR(50),
    FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
  `);
    const [rows] = await connection.query<RowDataPacket[]>(`
       SELECT 1 FROM vendor_warehouses LIMIT 1;
      `);
    if (rows.length >=1) {
        console.log("vendor_warehouses table created");
    }
}

async function createVendorServiceRequestTable(connection: Connection) {
    const [tableResult] = await connection.query(`
    CREATE TABLE IF NOT EXISTS vendor_service_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ticket_number VARCHAR(100) UNIQUE NOT NULL,         
    vendor_id VARCHAR(100),
    agent_id VARCHAR(100) NULL,
    category VARCHAR(100) NULL,
    priority VARCHAR(50) NULL,
    subject VARCHAR(255),
    description TEXT,
    status VARCHAR(50) NULL,
    resolution_notes TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    closed_at DATETIME NULL,
    
    INDEX idx_customer_id (vendor_id),
    INDEX idx_status (status),
    INDEX idx_agent_id (agent_id)
);
  `);
    const [rows] = await connection.query<RowDataPacket[]>(`
       SELECT 1 FROM vendor_service_record LIMIT 1;
      `);
    if (rows.length >=0) {
        console.log("vendor_service_record table created");
    }
}
async function createVendorServiceRequestAttachmentTable(connection: Connection) {
    const [tableResult] = await connection.query(`
    CREATE TABLE IF NOT EXISTS vendor_srattachment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ticket_number VARCHAR(100) UNIQUE NOT NULL,         
    filename VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
    const [rows] = await connection.query<RowDataPacket[]>(`
       SELECT 1 FROM vendor_srattachment LIMIT 1;
      `);
    if (rows.length >=0) {
        console.log("vendor_srattachment table created");
    }
}
