import mysql from 'mysql2/promise';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { AppError } from '../../../StandardUtility/AppError';

const getUniqueTicketId = async (connection: mysql.PoolConnection): Promise<number> => {
    try {
        const query = `
            SELECT MAX(CAST(SUBSTRING(ticket_number, 3) AS UNSIGNED)) AS maxId
            FROM driver_support_ticket
            WHERE ticket_number LIKE 'DT%'`;

        const [rows] = await connection.query<RowDataPacket[]>(query);
        const maxId = rows[0]?.maxId ? parseInt(rows[0].maxId) : 0;
        return maxId + 1;
    } catch (err) {
        throw new AppError('Error Generating Unique Ticket Id', 500);
    }
};

export const createDriverTicket = async (
    connection: mysql.PoolConnection,
    data: {
        driver_id: string;
        category: string;
        message: string;
    }
): Promise<{ ticket_number: string; id: number }> => {
    try {
        const ticketId = await getUniqueTicketId(connection);
        const ticket_number = `DT${ticketId}`;

        const insertQuery = `
            INSERT INTO driver_support_ticket (ticket_number, driver_id, category, message, status)
            VALUES (?, ?, ?, ?, 'OPEN')`;

        const [result] = await connection.query<ResultSetHeader>(insertQuery, [
            ticket_number,
            data.driver_id,
            data.category,
            data.message,
        ]);

        return { ticket_number, id: result.insertId };
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError('Error Creating Driver Ticket', 500);
    }
};

export const addTicketAttachment = async (
    connection: mysql.PoolConnection,
    ticket_number: string,
    filename: string,
    original_name: string
): Promise<void> => {
    try {
        const insertQuery = `
            INSERT INTO driver_ticket_attachment (ticket_number, filename, original_name)
            VALUES (?, ?, ?)`;

        await connection.query<ResultSetHeader>(insertQuery, [ticket_number, filename, original_name]);
    } catch (err) {
        throw new AppError('Error Saving Ticket Attachment', 500);
    }
};

export const getDriverTickets = async (
    connection: mysql.PoolConnection,
    driver_id: string,
    filters?: {
        status?: string;
        category?: string;
        limit?: number;
        offset?: number;
    }
): Promise<RowDataPacket[]> => {
    try {
        let query = `
            SELECT
                t.id,
                t.ticket_number,
                t.driver_id,
                t.category,
                t.message,
                t.status,
                t.created_at,
                t.updated_at,
                (SELECT filename FROM driver_ticket_attachment WHERE ticket_number = t.ticket_number LIMIT 1) AS attachment_filename,
                (SELECT original_name FROM driver_ticket_attachment WHERE ticket_number = t.ticket_number LIMIT 1) AS attachment_original_name
            FROM driver_support_ticket t
            WHERE t.driver_id = ?`;

        const params: any[] = [driver_id];

        if (filters?.status) {
            query += ` AND t.status = ?`;
            params.push(filters.status);
        }
        if (filters?.category) {
            query += ` AND t.category = ?`;
            params.push(filters.category);
        }

        query += ` ORDER BY t.created_at DESC`;

        if (filters?.limit) {
            query += ` LIMIT ?`;
            params.push(filters.limit);
        }
        if (filters?.offset) {
            query += ` OFFSET ?`;
            params.push(filters.offset);
        }

        const [rows] = await connection.query<RowDataPacket[]>(query, params);
        return rows;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError('Error Fetching Driver Tickets', 500);
    }
};
