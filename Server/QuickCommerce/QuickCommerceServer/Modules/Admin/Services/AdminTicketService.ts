import mysql from 'mysql2/promise';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { AppError } from '../../../StandardUtility/AppError';
import pool from "../../StandardConfig/MySqlDbConfig";

interface ServiceRecord {
    id?: number;
    ticket_number: string;
    vendor_id: string;
    agent_id?: string;
    category: string;
    priority: string;
    subject: string;
    description: string;
    status: string;
    resolution_notes?: string;
    created_at?: Date;
    updated_at?: Date;
    closed_at?: Date;
}

interface ServiceRecordAttachment {
    id?: number;
    ticket_number: string;
    filename: string;
    created_at?: Date;
}

const getUniqueServiceRecordId = async (connection: mysql.PoolConnection): Promise<number> => {
    try {
        const selectMaxTicketIdQuery = `
            SELECT MAX(CAST(SUBSTRING(ticket_number, 3) AS UNSIGNED)) AS maxTicketId
            FROM vendor_service_record
            WHERE ticket_number LIKE 'SR%'`;

        const [rows] = await connection.query<RowDataPacket[]>(selectMaxTicketIdQuery);
        const maxTicketNumber = rows[0]?.maxTicketId ? parseInt(rows[0]?.maxTicketId) : 0;
        return maxTicketNumber + 1;
    } catch (err) {
        throw new AppError("Error Generating Unique Ticket Id", 500);
    }
};

export const createServiceRecord = async (
    connection: mysql.PoolConnection,
    data: Omit<ServiceRecord, 'id' | 'ticket_number' | 'created_at' | 'updated_at'>
) => {
    try {
        const ticketId = await getUniqueServiceRecordId(connection);
        const ticket_number = `SR${ticketId}`;

        const insertQuery = `
            INSERT INTO vendor_service_record 
            (ticket_number, vendor_id, agent_id, category, priority, subject, description, status, resolution_notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const [result] = await connection.query<ResultSetHeader>(insertQuery, [
            ticket_number,
            data.vendor_id,
            data.agent_id || null,
            data.category,
            data.priority,
            data.subject,
            data.description,
            data.status,
            data.resolution_notes || null
        ]);

        return { ticket_number, id: result.insertId };
    } catch (err) {
        throw new AppError("Error Creating Service Record", 500);
    }
};

export const getServiceRecords = async (
    connection: mysql.PoolConnection,
    filters?: {
        vendor_id?: string;
        agent_id?: string;
        status?: string;
        priority?: string;
        category?: string;
        limit?: number;
        offset?: number;
    }
) => {
    try {
        let query = `SELECT * FROM vendor_service_record WHERE 1=1`;
        const params: any[] = [];

        if (filters?.vendor_id) {
            query += ` AND vendor_id = ?`;
            params.push(filters.vendor_id);
        }
        if (filters?.agent_id) {
            query += ` AND agent_id = ?`;
            params.push(filters.agent_id);
        }
        if (filters?.status) {
            query += ` AND status = ?`;
            params.push(filters.status);
        }
        if (filters?.priority) {
            query += ` AND priority = ?`;
            params.push(filters.priority);
        }
        if (filters?.category) {
            query += ` AND category = ?`;
            params.push(filters.category);
        }

        query += ` ORDER BY created_at DESC`;

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
        throw new AppError("Error Fetching Service Records", 500);
    }
};

export const getServiceRecordByTicketNumber = async (
    connection: mysql.PoolConnection,
    ticket_number: string
) => {
    try {
        const query = `SELECT * FROM vendor_service_record WHERE ticket_number = ?`;
        const [rows] = await connection.query<RowDataPacket[]>(query, [ticket_number]);
        
        if (rows.length === 0) {
            throw new AppError("Service Record Not Found", 404);
        }

        return rows[0];
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError("Error Fetching Service Record", 500);
    }
};

export const updateServiceRecord = async (
    connection: mysql.PoolConnection,
    ticket_number: string,
    data: Partial<Omit<ServiceRecord, 'id' | 'ticket_number' | 'created_at' | 'updated_at'>>
) => {
    try {
        const updates: string[] = [];
        const params: any[] = [];

        if (data.agent_id !== undefined) {
            updates.push('agent_id = ?');
            params.push(data.agent_id);
        }
        if (data.category) {
            updates.push('category = ?');
            params.push(data.category);
        }
        if (data.priority) {
            updates.push('priority = ?');
            params.push(data.priority);
        }
        if (data.subject) {
            updates.push('subject = ?');
            params.push(data.subject);
        }
        if (data.description) {
            updates.push('description = ?');
            params.push(data.description);
        }
        if (data.status) {
            updates.push('status = ?');
            params.push(data.status);
            if (data.status === 'closed') {
                updates.push('closed_at = NOW()');
            }
        }
        if (data.resolution_notes !== undefined) {
            updates.push('resolution_notes = ?');
            params.push(data.resolution_notes);
        }

        if (updates.length === 0) {
            throw new AppError("No Fields to Update", 400);
        }

        params.push(ticket_number);
        const query = `UPDATE vendor_service_record SET ${updates.join(', ')} WHERE ticket_number = ?`;
        
        const [result] = await connection.query<ResultSetHeader>(query, params);
        
        if (result.affectedRows === 0) {
            throw new AppError("Service Record Not Found", 404);
        }

        return { success: true };
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError("Error Updating Service Record", 500);
    }
};

export const deleteServiceRecord = async (
    connection: mysql.PoolConnection,
    ticket_number: string
) => {
    try {
        // Delete attachments first
        await connection.query('DELETE FROM vendor_srattachment WHERE ticket_number = ?', [ticket_number]);
        
        // Delete service record
        const [result] = await connection.query<ResultSetHeader>(
            'DELETE FROM vendor_service_record WHERE ticket_number = ?',
            [ticket_number]
        );

        if (result.affectedRows === 0) {
            throw new AppError("Service Record Not Found", 404);
        }

        return { success: true };
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError("Error Deleting Service Record", 500);
    }
};

export const addAttachment = async (
    connection: mysql.PoolConnection,
    ticket_number: string,
    filename: string
) => {
    try {
        // Use upsert because vendor_srattachment has UNIQUE KEY on ticket_number
        const upsertQuery = `
            INSERT INTO vendor_srattachment (ticket_number, filename)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE filename = VALUES(filename)`;
        const [result] = await connection.query<ResultSetHeader>(upsertQuery, [ticket_number, filename]);
        
        return { id: result.insertId, ticket_number, filename };
    } catch (err) {
        throw new AppError("Error Adding Attachment", 500);
    }
};

export const getAttachments = async (
    connection: mysql.PoolConnection,
    ticket_number: string
) => {
    try {
        const query = `SELECT * FROM vendor_srattachment WHERE ticket_number = ?`;
        const [rows] = await connection.query<RowDataPacket[]>(query, [ticket_number]);
        return rows;
    } catch (err) {
        throw new AppError("Error Fetching Attachments", 500);
    }
};

export const getTicketStats = async (connection: mysql.PoolConnection) => {
    try {
        const query = `
            SELECT 
                COUNT(*) as total_tickets,
                SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_tickets,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tickets,
                SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_tickets,
                SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high_priority_tickets,
                SUM(CASE WHEN priority = 'medium' THEN 1 ELSE 0 END) as medium_priority_tickets,
                SUM(CASE WHEN priority = 'low' THEN 1 ELSE 0 END) as low_priority_tickets
            FROM vendor_service_record`;
        
        const [rows] = await connection.query<RowDataPacket[]>(query);
        return rows[0];
    } catch (err) {
        throw new AppError("Error Fetching Ticket Statistics", 500);
    }
};