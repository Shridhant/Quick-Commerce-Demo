import mysql, { Connection, RowDataPacket } from "mysql2/promise";
import {
  MYSQL_DATABASE,
  MYSQL_HOST,
  MYSQL_PASSWORD,
  MYSQL_USER,
} from "../../StandardConfig/SettingsReader";

export async function setUpCommonSchema(): Promise<void> {
  let connection: Connection | undefined;
  try {
    connection = await mysql.createConnection({
      host: MYSQL_HOST,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
    });
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

    await createPushNotificationTable(connection);
  } catch (err) {
    throw err;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}


async function createPushNotificationTable(connection: Connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS push_tokens (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,

      phone VARCHAR(20),
      user_id VARCHAR(100) NULL,

      user_type ENUM('DRIVER','VENDOR','CUSTOMER') NOT NULL,

      app_type ENUM('DRIVER_VENDOR_APP','CUSTOMER_APP') NOT NULL,
      device_type ENUM('ANDROID','IOS') NOT NULL,

      device_id VARCHAR(100) NOT NULL,      -- 🔑 physical device
      fcm_token VARCHAR(255) NOT NULL,

      is_active BOOLEAN DEFAULT TRUE,

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      UNIQUE KEY uniq_device_app (device_id, app_type),
      INDEX idx_user (user_id, user_type),
      INDEX idx_active (is_active)
    );
  `);

   const [rows] = await connection.query<RowDataPacket[]>(`
       SELECT 1 FROM push_tokens LIMIT 1;
      `);
  if (rows.length >= 0) {
    console.log("push_tokens table created");
  }
}
