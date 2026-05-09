import { AppError } from "../Config/AppError";
import { CustomCode } from "../Config/CustomCode";
import { HttpStatusCode } from "../Config/HttpStatusCode";
import pool from "../Config/MySqlDbConfig";
import { RowDataPacket } from "mysql2";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET } from "../Config/SettingReader";
import mysql from 'mysql2/promise';
import { CustomerStatus } from "../Utility/CustomerStatus";

export const verifyAndLogin = async (otp: string, phone: string) => {
    const connection = await pool.getConnection();
    let isAddress: boolean = false;
    let customerId = '';
    try {
        await connection.beginTransaction();

        // 1. Validate OTP
        const [rows] = await connection.query<RowDataPacket[]>(
            `SELECT * FROM otps WHERE phone = ? AND otp = ? AND expires_at > NOW()`,
            [phone, otp]
        );

        if (rows.length === 0) {
            throw new AppError("Invalid or expired OTP", HttpStatusCode.UNAUTHORIZED, CustomCode.UnauthorizedCode);
        }

        // 2. Remove used OTP
        await connection.query(`DELETE FROM otps WHERE phone = ?`, [phone]);

        // 3. Check if user exists
        const [userRows] = await connection.query<RowDataPacket[]>(
            'SELECT * FROM customer WHERE phone = ?', [phone]
        );

        const payload = {
            phone: phone,
            purpose: "customer",
            customerId : ""
        }
        // 4. If user doesn't exist, insert
        if (userRows.length === 0) {
            customerId = await registerCustomer(phone,connection);
            payload.customerId = customerId
        }else{
            payload.customerId = userRows[0]?.customer_id;
        }

        const [address] = await connection.query<RowDataPacket[]>(
            'SELECT * FROM customer_addresses'
        );

        if (address.length > 0) {
            isAddress = true;
        }

        await connection.commit();

        const token = generateToken(payload);

        return { success: true, code: CustomCode.SuccessCode, token, role: "CUSTOMER", isAddress,name : userRows[0]?.name };

    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};


export const registerCustomer= async (phone: string, connection: mysql.PoolConnection) => {
    let customerId = "";
    try {
        const maxCustomerId = await getCustomerId(connection);
        let nextCodeNumber = maxCustomerId + 1;
        customerId = `CUST${nextCodeNumber.toString()}`;

        const query = `INSERT INTO customer (customer_id, phone, isActive,status) VALUES (?, ?, ?,?)`;
        const [result] = await connection.query<any>(query, [customerId, phone, true, CustomerStatus.REGISTERED]);

        if (result?.affectedRows === 0) {
            throw new AppError("Failed to insert vendor");
        }

        return customerId;

    } catch (err) {
        throw err;
    }
};

const generateToken = (payload: any): string => {
    const token = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
        expiresIn: '1h' // token expiry
    });
    return token;
};

const getCustomerId = async (connection: mysql.PoolConnection) => {
    try {
        const selectCustomerCodeQuery = `
            SELECT MAX(CAST(SUBSTRING(customer_id, 5) AS UNSIGNED)) AS customerId
            FROM customer
            WHERE customer_id LIKE 'CUST%'`;

        const [rows] = await connection.query<RowDataPacket[]>(selectCustomerCodeQuery);

        const maxCustomerId = rows[0]?.customerId ? parseInt(rows[0]?.customerId) : 10000000;
        return maxCustomerId;
    } catch (err) {
        console.log(err)
        throw new AppError("Error Generating Unique Customer Code",);
    }
};