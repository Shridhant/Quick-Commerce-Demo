import mysql, { Pool } from "mysql2/promise";
import { MYSQL_DATABASE, MYSQL_HOST, MYSQL_PASSWORD, MYSQL_USER } from "./SettingsReader";
import { setUpDatabase } from "../Vendor/Config/SetUpTables";
import { setUpRequiredSchema } from "../Admin/Config/AdminTablesSetup";
import { setUpCommonSchema } from "../Common/Config/CommonTablesSetup";

setUpSchema();
async function setUpSchema() {
  await setUpDatabase();
  await setUpRequiredSchema();
  await setUpCommonSchema();
}
const pool: Pool = mysql.createPool({
    host: MYSQL_HOST,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
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