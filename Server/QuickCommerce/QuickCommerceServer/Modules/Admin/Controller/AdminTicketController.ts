import { Request, Response, NextFunction } from 'express';
import mysql from 'mysql2/promise';
import * as serviceRecordService from '../Services/AdminTicketService';
import { AppError } from '../../../StandardUtility/AppError';
import pool from "../../StandardConfig/MySqlDbConfig";

export const createTicket = async (req: Request, res: Response, next: NextFunction) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const { vendor_id, agent_id, category, priority, subject, description, status, resolution_notes } = req.body;

        if (!vendor_id || !category || !priority || !subject || !description || !status) {
            throw new AppError("Missing Required Fields", 400);
        }

        const result = await serviceRecordService.createServiceRecord(connection, {
            vendor_id,
            agent_id,
            category,
            priority,
            subject,
            description,
            status,
            resolution_notes
        });

        await connection.commit();

        res.status(201).json({
            success: true,
            message: "Service Record Created Successfully",
            data: result
        });
    } catch (err) {
        await connection.rollback();
        next(err);
    } finally {
        connection.release();
    }
};

export const getAllTickets = async (req: Request, res: Response, next: NextFunction) => {
    const connection = await pool.getConnection();
    
    try {
        const { vendor_id, agent_id, status, priority, category, limit, offset } = req.query;

        const filters = {
            vendor_id: vendor_id as string,
            agent_id: agent_id as string,
            status: status as string,
            priority: priority as string,
            category: category as string,
            limit: limit ? parseInt(limit as string) : undefined,
            offset: offset ? parseInt(offset as string) : undefined
        };

        const tickets = await serviceRecordService.getServiceRecords(connection, filters);

        res.status(200).json({
            success: true,
            count: tickets.length,
            data: tickets
        });
    } catch (err) {
        next(err);
    } finally {
        connection.release();
    }
};

export const getTicketByNumber = async (req: Request, res: Response, next: NextFunction) => {
    const connection = await pool.getConnection();
    
    try {
        const { ticket_number } = req.params;

        const ticket = await serviceRecordService.getServiceRecordByTicketNumber(connection, ticket_number);

        res.status(200).json({
            success: true,
            data: ticket
        });
    } catch (err) {
        next(err);
    } finally {
        connection.release();
    }
};

export const updateTicket = async (req: Request, res: Response, next: NextFunction) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const { ticket_number } = req.params;
        const updateData = req.body;

        await serviceRecordService.updateServiceRecord(connection, ticket_number, updateData);

        await connection.commit();

        res.status(200).json({
            success: true,
            message: "Service Record Updated Successfully"
        });
    } catch (err) {
        await connection.rollback();
        next(err);
    } finally {
        connection.release();
    }
};

export const deleteTicket = async (req: Request, res: Response, next: NextFunction) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const { ticket_number } = req.params;

        await serviceRecordService.deleteServiceRecord(connection, ticket_number);

        await connection.commit();

        res.status(200).json({
            success: true,
            message: "Service Record Deleted Successfully"
        });
    } catch (err) {
        await connection.rollback();
        next(err);
    } finally {
        connection.release();
    }
};

export const addTicketAttachment = async (req: Request, res: Response, next: NextFunction) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const { ticket_number } = req.params;
        const { filename } = req.body;

        if (!filename) {
            throw new AppError("Filename is Required", 400);
        }

        const result = await serviceRecordService.addAttachment(connection, ticket_number, filename);

        await connection.commit();

        res.status(201).json({
            success: true,
            message: "Attachment Added Successfully",
            data: result
        });
    } catch (err) {
        await connection.rollback();
        next(err);
    } finally {
        connection.release();
    }
};

export const getTicketAttachments = async (req: Request, res: Response, next: NextFunction) => {
    const connection = await pool.getConnection();
    
    try {
        const { ticket_number } = req.params;

        const attachments = await serviceRecordService.getAttachments(connection, ticket_number);

        res.status(200).json({
            success: true,
            count: attachments.length,
            data: attachments
        });
    } catch (err) {
        next(err);
    } finally {
        connection.release();
    }
};

export const getTicketStatistics = async (req: Request, res: Response, next: NextFunction) => {
    const connection = await pool.getConnection();
    
    try {
        const stats = await serviceRecordService.getTicketStats(connection);

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (err) {
        next(err);
    } finally {
        connection.release();
    }
};