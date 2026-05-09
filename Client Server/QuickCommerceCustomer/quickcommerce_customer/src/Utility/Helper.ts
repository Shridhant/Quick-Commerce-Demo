import { RowDataPacket } from "mysql2";
import pool from "../Config/MySqlDbConfig";
import { v4 as uuidv4 } from "uuid";


export const generateUniqueId = async (
  table: string,
  column: string
): Promise<string> => {
  let uniqueId: string;
  let exists = true;

  while (exists) {
    uniqueId = uuidv4().replace(/-/g, "").substring(0, 30);

    const [rows] = await pool.query<(RowDataPacket & { count: number })[]>(
      `SELECT COUNT(*) as count FROM ?? WHERE ?? = ?`,
      [table, column, uniqueId]
    );

    exists = rows[0].count > 0;
  }

  return uniqueId!;
};