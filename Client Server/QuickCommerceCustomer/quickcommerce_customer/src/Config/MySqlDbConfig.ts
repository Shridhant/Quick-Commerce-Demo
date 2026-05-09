import mysql, { Pool } from "mysql2/promise";
import { MYSQL_DATABASE, MYSQL_HOST, MYSQL_PASSWORD, MYSQL_USER } from "./SettingReader";
import { setUpCustomerDatabase } from "./SetupDatabase";


setUpSchema();
async function setUpSchema() {
    await setUpCustomerDatabase();
}
const pool: Pool = mysql.createPool({
    host: MYSQL_HOST,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
})

pool.getConnection()
    .then((connection) => {
        console.log("SQL connection success");
        connection.release();
    })
    .catch((err) => {
        console.error("Error Connecting to SQL: ", err);
    });

export default pool;