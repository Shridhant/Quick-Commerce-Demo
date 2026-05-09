import { AppError } from "../../../StandardUtility/AppError";
import { CustomCode } from "../../../StandardUtility/CustomCode";
import { HttpStatusCode } from "../../../StandardUtility/HttpStatusCode";
import pool from "../../StandardConfig/MySqlDbConfig";
import mysql, { RowDataPacket } from 'mysql2/promise';
import { ACCESS_TOKEN_SECRET } from "../../StandardConfig/SettingsReader";
import jwt from 'jsonwebtoken';
import { StandardStatus } from "../../../StandardUtility/StatusEnum";


// driver_id VARCHAR(100) PRIMARY KEY NOT NULL,
//       name VARCHAR(255),
//       password VARCHAR(255),
//       email VARCHAR(255),
//       phone VARCHAR(20),
//       address_line1 VARCHAR(255),
//       address_line2 VARCHAR(255),
//       city VARCHAR(100),
//       state VARCHAR(100),
//       postal_code VARCHAR(20),
//       status VARCHAR(50),
//       country VARCHAR(100),
//       isActive BOOLEAN DEFAULT FALSE,
//       isDocumentVerified BOOLEAN DEFAULT FALSE,
//       vehicle_number VARCHAR(50),
//       vehicle_type VARCHAR(50),
//       vehicle_license_file VARCHAR(255),

export const registerAndUpdateDriverProfile = async (
  name: string,
  email: string | null,
  address_line1: string | null,
  address_line2: string | null,
  city: string | null,
  state: string | null,
  postal_code: string | null,
  phone: string,
  vehicle_number: string,
  vehicle_type: string,
  driving_license_file: string | null,
  vehicleImage: string | null
) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await isDriverExist(phone, connection);

    const maxDriverCode = await getDriverId(connection); // e.g., return 1000001
    const nextCodeNumber = (maxDriverCode || 1000000) + 1;
    const driverId = `DRV${nextCodeNumber.toString().padStart(6, '0')}`;

    const insertDriverQuery = `
      INSERT INTO driver (
        driver_id, name, email, phone,
        address_line1, address_line2, city, state, postal_code,
        status, isActive, isDocumentVerified,isDocumentUploaded,
        vehicle_number, vehicle_type, driving_license_file,vehicle_image
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    const driverValues = [
      driverId, name, email, phone,
      address_line1, address_line2, city, state, postal_code,
      'PENDING', true, false,true,
      vehicle_number, vehicle_type, driving_license_file,vehicleImage
    ];

    const updateUserQuery = `UPDATE user SET name = ?, email = ?, role = ?, isActive = ? WHERE phone = ?`;
    const userValues = [name, email, 'DRIVER', true, phone];

    await connection.query(updateUserQuery, userValues);
    await connection.query(insertDriverQuery, driverValues);

    await connection.commit();

    const payload = {
      driverId,
      purpose: 'driver'
    };

    const token = generateToken(payload);
    if (!token) {
      throw new AppError("Error generating token", HttpStatusCode.INTERNAL_SERVER_ERROR, CustomCode.ServerErrorCode);
    }

    return {
      success: true,
      code: CustomCode.SuccessCode,
      message: "Driver registered and profile updated successfully.",
      newToken: token,
      role : "DRIVER"
    };

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const generateToken = (payload: any): string => {
    const token = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
        expiresIn: '1h' // token expiry
    });
    return token;
};

const getDriverId = async (connection: mysql.PoolConnection) => {
    try {
        const selectDriverCodeQuery = `
            SELECT MAX(CAST(SUBSTRING(driver_id, 4) AS UNSIGNED)) AS driverId
            FROM driver
            WHERE driver_id LIKE 'DRV%'`;

        const [rows] = await connection.query<RowDataPacket[]>(selectDriverCodeQuery);

        const maxDriverCode = rows[0]?.driverId ? parseInt(rows[0]?.driverId) : 1000000;
        return maxDriverCode;
    } catch (err) {
        throw new AppError("Error Generating Unique Driver Code",);
    }
};

const isDriverExist = async (phone: string, connection: mysql.PoolConnection) => {
    try {

        const [result] = await connection.query<RowDataPacket[]>(`select * from driver where phone = ?`, [phone]);
        if (result.length) {
            throw new AppError("Driver Already Exist", HttpStatusCode.CONFLICT, CustomCode.ConflictCode);
        }
        return result[0];
    } catch (err) {
        throw err;
    }
}

export const createDriverTokenAndLogin = async (driverID: string, connection: mysql.PoolConnection) => {
    try {
        const [result] = await connection.query<RowDataPacket[]>("select * from driver where driver_id = ?", [driverID]);

        if (!result.length) throw new AppError("Driver Not Found", HttpStatusCode.NOT_FOUND, CustomCode.NotFoundCode);

        const payload = {
            driverId: driverID,
            purpose: 'driver'
        }
        const token = generateToken(payload);
        if (!token) {
            throw new AppError("Error generating Token", HttpStatusCode.INTERNAL_SERVER_ERROR, CustomCode.ServerErrorCode);
        }

        return {
            success: true,
            status: HttpStatusCode.OK,
            code: CustomCode.SuccessCode,
            message: 'Login Successful',
            token,
            documentUploaded: result[0].isDocumentUploaded == 0 ? false : true,
            name: result[0].name,
            role : 'DRIVER'
        }
    } catch (err) {
        throw err;
    }
}

export const getDriverDashboardDetails = async (driverId : string)=>{

    try{

        const [result] = await pool.query<RowDataPacket[]>('SELECT driver_id, name, email, phone, address_line1, address_line2, city, state, postal_code, status, country, isActive, isDocumentVerified,isDocumentUploaded, vehicle_number, vehicle_type, vehicle_image, driving_license_file from driver where driver_id = ?',[driverId])

        const [warehouses] = await pool.query<RowDataPacket[]>('SELECT * from warehouse where status = ?',[StandardStatus.ACTIVE]);

        if(!result.length) throw new AppError("Driver Not Found",HttpStatusCode.NOT_FOUND,CustomCode.NotFoundCode);
         return {success : true,code : CustomCode.SuccessCode,messgae : "Data Fetch Successfully",driver : result[0],warehouses};
    }catch(err){
        throw err;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/driver/profile — Update driver profile
// Updates driver's personal and vehicle information
// ─────────────────────────────────────────────────────────────────────────────
export interface UpdateDriverProfileParams {
  driverId: string;
  name?: string;
  email?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  vehicle_number?: string;
  vehicle_type?: string;
}

export const updateDriverProfile = async (params: UpdateDriverProfileParams) => {
  const connection = await pool.getConnection();
  try {
    const { driverId, ...updates } = params;

    // Check if driver exists
    const [existingDriver] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM driver WHERE driver_id = ?',
      [driverId]
    );

    if (existingDriver.length === 0) {
      return {
        success: false,
        message: "Driver not found",
        code: CustomCode.NotFoundCode,
        result: null,
      };
    }

    // Build dynamic update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (updates.name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(updates.name);
    }
    if (updates.email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(updates.email);
    }
    if (updates.address_line1 !== undefined) {
      updateFields.push('address_line1 = ?');
      updateValues.push(updates.address_line1);
    }
    if (updates.address_line2 !== undefined) {
      updateFields.push('address_line2 = ?');
      updateValues.push(updates.address_line2);
    }
    if (updates.city !== undefined) {
      updateFields.push('city = ?');
      updateValues.push(updates.city);
    }
    if (updates.state !== undefined) {
      updateFields.push('state = ?');
      updateValues.push(updates.state);
    }
    if (updates.postal_code !== undefined) {
      updateFields.push('postal_code = ?');
      updateValues.push(updates.postal_code);
    }
    if (updates.vehicle_number !== undefined) {
      updateFields.push('vehicle_number = ?');
      updateValues.push(updates.vehicle_number);
    }
    if (updates.vehicle_type !== undefined) {
      updateFields.push('vehicle_type = ?');
      updateValues.push(updates.vehicle_type);
    }

    if (updateFields.length === 0) {
      return {
        success: false,
        message: "No fields to update",
        code: CustomCode.BadRequestCode,
        result: null,
      };
    }

    updateValues.push(driverId);

    await connection.query(
      `UPDATE driver SET ${updateFields.join(', ')} WHERE driver_id = ?`,
      updateValues
    );

    // Fetch updated driver
    const [updatedDriver] = await connection.query<RowDataPacket[]>(
      'SELECT driver_id, name, email, phone, address_line1, address_line2, city, state, postal_code, status, isActive, vehicle_number, vehicle_type FROM driver WHERE driver_id = ?',
      [driverId]
    );

    return {
      success: true,
      message: "Profile updated successfully",
      code: CustomCode.SuccessCode,
      result: {
        driver: updatedDriver[0],
      },
    };
  } catch (err) {
    throw err;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/driver/status — Toggle driver online/offline status
// Updates driver's availability status (isAvailable column)
// ─────────────────────────────────────────────────────────────────────────────
export const updateDriverStatus = async (driverId: string, isAvailable: boolean) => {
  const connection = await pool.getConnection();
  try {
    // Check if driver exists
    const [existingDriver] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM driver WHERE driver_id = ?',
      [driverId]
    );

    if (existingDriver.length === 0) {
      return {
        success: false,
        message: "Driver not found",
        code: CustomCode.NotFoundCode,
        result: null,
      };
    }

    // Update isAvailable status (driver online/offline toggle)
    await connection.query(
      'UPDATE driver SET isAvailable = ? WHERE driver_id = ?',
      [isAvailable, driverId]
    );

    return {
      success: true,
      message: isAvailable ? "You are now online" : "You are now offline",
      code: CustomCode.SuccessCode,
      result: {
        isAvailable,
      },
    };
  } catch (err) {
    throw err;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/driver/location — Update driver's current GPS location
// NOTE: Requires these columns to be added to the driver table first:
//   ALTER TABLE driver ADD COLUMN current_latitude DECIMAL(10, 8);
//   ALTER TABLE driver ADD COLUMN current_longitude DECIMAL(11, 8);
//   ALTER TABLE driver ADD COLUMN location_updated_at DATETIME;
// ─────────────────────────────────────────────────────────────────────────────
export const updateDriverLocation = async (
  driverId: string,
  latitude: number,
  longitude: number
) => {
  // Return error since columns don't exist in current schema
  // Once you add the columns, uncomment the code below
  return {
    success: false,
    message: "Location tracking is not enabled. Please add current_latitude, current_longitude, and location_updated_at columns to the driver table.",
    code: CustomCode.BadRequestCode,
    result: null,
  };

  /*
  const connection = await pool.getConnection();
  try {
    // Check if driver exists
    const [existingDriver] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM driver WHERE driver_id = ?',
      [driverId]
    );

    if (existingDriver.length === 0) {
      return {
        success: false,
        message: "Driver not found",
        code: CustomCode.NotFoundCode,
        result: null,
      };
    }

    // Update driver location
    await connection.query(
      'UPDATE driver SET current_latitude = ?, current_longitude = ?, location_updated_at = NOW() WHERE driver_id = ?',
      [latitude, longitude, driverId]
    );

    return {
      success: true,
      message: "Location updated successfully",
      code: CustomCode.SuccessCode,
      result: {
        latitude,
        longitude,
        updatedAt: new Date().toISOString(),
      },
    };
  } catch (err) {
    throw err;
  } finally {
    if (connection) {
      connection.release();
    }
  }
  */
};





export const saveDriverPushToken = async (
  driverId: string,
  pushToken: string,
  platform: string,
  deviceId: string | null,
  deviceModel: string | null,
  appVersion: string | null
) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const query = `
      INSERT INTO driver_push_tokens (driver_id, push_token, platform, device_id, device_model, app_version)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        driver_id = VALUES(driver_id),
        push_token = VALUES(push_token),
        platform = VALUES(platform),
        device_id = VALUES(device_id),
        device_model = VALUES(device_model),
        app_version = VALUES(app_version),
        is_active = TRUE,
        updated_at = NOW()
    `;

    await connection.query(query, [driverId, pushToken, platform, deviceId, deviceModel, appVersion]);
    await connection.commit();

    return { success: true, message: "Push token saved successfully" };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};