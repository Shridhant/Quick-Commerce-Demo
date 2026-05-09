import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { JwtPayload } from 'jsonwebtoken';
import pool from '../../StandardConfig/MySqlDbConfig';
import { AppError } from '../../../StandardUtility/AppError';
import { saveUploadedFile } from '../../../StandardUtility/FileUpload';
import * as driverTicketService from '../Service/DriverTicketService';

interface MyDriverPayload extends JwtPayload {
    driverId: string;
    purpose: string;
}

interface AuthenticatedDriverRequest extends Request {
    driver?: string | MyDriverPayload;
}

const TICKET_UPLOAD_ROOT = path.join(__dirname, '../../Uploads');

export const createDriverTicketHandler = async (
    req: AuthenticatedDriverRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        let driverId = '';
        if (req.driver && typeof req.driver === 'object') {
            driverId = (req.driver as MyDriverPayload).driverId;
        }
        if (!driverId) throw new AppError('Driver ID not Found', 401);

        const { category, message } = req.body;

        if (!category || !message) {
            throw new AppError('Category and Message are required', 400);
        }

        const { ticket_number, id } = await driverTicketService.createDriverTicket(connection, {
            driver_id: driverId,
            category,
            message,
        });

        // Handle optional file attachment
        if (req.file) {
            const savedFilename = await saveUploadedFile(req.file, TICKET_UPLOAD_ROOT, ticket_number);
            await driverTicketService.addTicketAttachment(
                connection,
                ticket_number,
                savedFilename,
                req.file.originalname
            );
        }

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Ticket Created Successfully',
            data: { id, ticket_number },
        });
    } catch (err) {
        await connection.rollback();
        next(err);
    } finally {
        connection.release();
    }
};

export const getDriverTicketsHandler = async (
    req: AuthenticatedDriverRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const connection = await pool.getConnection();

    try {
        let driverId = '';
        if (req.driver && typeof req.driver === 'object') {
            driverId = (req.driver as MyDriverPayload).driverId;
        }
        if (!driverId) throw new AppError('Driver ID not Found', 401);

        const { status, category, limit, offset } = req.query;

        const tickets = await driverTicketService.getDriverTickets(connection, driverId, {
            status: status as string | undefined,
            category: category as string | undefined,
            limit: limit ? parseInt(limit as string) : undefined,
            offset: offset ? parseInt(offset as string) : undefined,
        });

        res.status(200).json({
            success: true,
            count: tickets.length,
            data: tickets,
        });
    } catch (err) {
        next(err);
    } finally {
        connection.release();
    }
};
