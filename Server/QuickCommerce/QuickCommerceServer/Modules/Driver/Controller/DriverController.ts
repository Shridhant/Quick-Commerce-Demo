import { Request, Response } from "express";
import { HttpStatusCode } from "../../../StandardUtility/HttpStatusCode";
import { saveUploadedFile } from "../../../StandardUtility/FileUpload";
import fs from "fs/promises";
import path from "path";
import { getDriverDashboardDetails, registerAndUpdateDriverProfile, updateDriverProfile, updateDriverStatus, updateDriverLocation, saveDriverPushToken } from "../Service/DriverService";
import { AppError } from "../../../StandardUtility/AppError";
import { CustomCode } from "../../../StandardUtility/CustomCode";
import { AuthenticatedDriverRequest, AuthenticatedUserRequest } from "../../../StandardUtility/CustomVendorPayload";


export const driverProfileUpdateAndRegistration = async (req: AuthenticatedUserRequest, res: Response) => {
    const {
        name,
        email,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        vehicle_number,
        vehicle_type,
    } = req.body;

    const drivingLicense =
        !Array.isArray(req.files) ? req.files?.['drivingLicense']?.[0] || null : null;
    const vehicleImage =
        !Array.isArray(req.files) ? req.files?.['vehicleImage']?.[0] || null : null;


    const uploadedFiles: string[] = [];
    try {

      // Navigate from dist/Modules/Driver/Controller back to the project root
      const rootFolder = path.resolve(
        __dirname,
        '../../../../Modules/Driver/Uploads'
      );

        let savedDriverLiscense = null;
        if (drivingLicense) {
            savedDriverLiscense = await saveUploadedFile(drivingLicense, rootFolder, "DRIVER");
            uploadedFiles.push(path.join(rootFolder, "drivingLicense", savedDriverLiscense));
        }

        let savedVehicleImage = null;
        if (vehicleImage) {
            savedVehicleImage = await saveUploadedFile(vehicleImage, rootFolder, "DRIVER");
            uploadedFiles.push(path.join(rootFolder, "vehicleImage", savedVehicleImage));
        }
        let phone: string = 'DEFAULT';
        if (req.user && typeof req.user === "object") {
            phone = req.user.phone;
        }

        if (phone === 'DEFAULT') {
            throw new AppError("Invalid Token/Expired Token", HttpStatusCode.UNAUTHORIZED, CustomCode.UnauthorizedCode)
        }
        const response = await registerAndUpdateDriverProfile(name, email, address_line1, address_line2, city, state, postal_code, phone, vehicle_number, vehicle_type, savedDriverLiscense, savedVehicleImage);
        res.status(HttpStatusCode.OK).json(response)
    } catch (err) {
        for (const filePath of uploadedFiles) {
            try {
                await fs.unlink(filePath);
            } catch (unlinkErr) {
                console.error(`Error deleting file ${filePath}:`, unlinkErr);
            }
        }
        throw err;
    }

};


export const fetchDriverDashboard = async (req: AuthenticatedDriverRequest, res: Response) => {
    try {

        let driverId: string = "";

        if (req.driver && typeof req.driver === "object") {
            driverId = req.driver.driverId;
        }
        if(!driverId) throw new AppError("Driver ID not Found",)
        const response = await getDriverDashboardDetails(driverId);
        res.status(HttpStatusCode.OK).json(response)
    } catch (err) {
        throw err;
    }
};


// ─── PUT /api/driver/profile ─────────────────────────────────────────────────
export const updateDriverProfileHandler = async (req: AuthenticatedDriverRequest, res: Response) => {
    try {
        let driverId: string = "";

        if (req.driver && typeof req.driver === "object") {
            driverId = req.driver.driverId;
        }
        if (!driverId) throw new AppError("Driver ID not Found", HttpStatusCode.UNAUTHORIZED, CustomCode.UnauthorizedCode);

        const { name, email, address_line1, address_line2, city, state, postal_code, vehicle_number, vehicle_type } = req.body;

        const response = await updateDriverProfile({
            driverId,
            name,
            email,
            address_line1,
            address_line2,
            city,
            state,
            postal_code,
            vehicle_number,
            vehicle_type,
        });

        const statusCode = response.success ? HttpStatusCode.OK : HttpStatusCode.BAD_REQUEST;
        res.status(statusCode).json(response);
    } catch (err) {
        throw err;
    }
};

// ─── PUT /api/driver/status ──────────────────────────────────────────────────
export const updateDriverStatusHandler = async (req: AuthenticatedDriverRequest, res: Response) => {
    try {
        let driverId: string = "";

        if (req.driver && typeof req.driver === "object") {
            driverId = req.driver.driverId;
        }
        if (!driverId) throw new AppError("Driver ID not Found", HttpStatusCode.UNAUTHORIZED, CustomCode.UnauthorizedCode);

        const body = req.body || {};
        const isAvailable = body.isAvailable;

        if (typeof isAvailable !== 'boolean') {
            res.status(HttpStatusCode.BAD_REQUEST).json({
                success: false,
                message: "isAvailable must be a boolean value",
                code: CustomCode.BadRequestCode,
                result: null,
            });
            return;
        }

        const response = await updateDriverStatus(driverId, isAvailable);
        res.status(HttpStatusCode.OK).json(response);
    } catch (err) {
        throw err;
    }
};

// ─── PUT /api/driver/location ────────────────────────────────────────────────
export const updateDriverLocationHandler = async (req: AuthenticatedDriverRequest, res: Response) => {
    try {
        let driverId: string = "";

        if (req.driver && typeof req.driver === "object") {
            driverId = req.driver.driverId;
        }
        if (!driverId) throw new AppError("Driver ID not Found", HttpStatusCode.UNAUTHORIZED, CustomCode.UnauthorizedCode);

        const body = req.body || {};
        const { latitude, longitude } = body;

        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            res.status(HttpStatusCode.BAD_REQUEST).json({
                success: false,
                message: "latitude and longitude must be numbers",
                code: CustomCode.BadRequestCode,
                result: null,
            });
            return;
        }

        const response = await updateDriverLocation(driverId, latitude, longitude);
        res.status(HttpStatusCode.OK).json(response);
    } catch (err) {
        throw err;
    }
};



//psuh token 
export const saveDriverPushTokenController = async (
  req: AuthenticatedDriverRequest,
  res: Response
) => {
  try {
    let driverId: string = "DEFAULT";
    if (req.driver && typeof req.driver === "object") {
      driverId = req.driver.driverId;
    }

    if (driverId === "DEFAULT") {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        success: false,
        code: HttpStatusCode.UNAUTHORIZED,
        message: "Unauthorized access",
      });
    }

    const { pushToken, platform, deviceId, deviceModel, appVersion } = req.body;

    const response = await saveDriverPushToken(
      driverId,
      pushToken,
      platform,
      deviceId ?? null,
      deviceModel ?? null,
      appVersion ?? null
    );

    res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    throw err;
  }
};