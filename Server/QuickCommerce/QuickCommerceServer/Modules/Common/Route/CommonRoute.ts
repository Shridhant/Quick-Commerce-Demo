import express, { Request, Response, NextFunction } from "express";
import { userLoginValidation, userOtpValidation } from "../../../StandardValidator/CommonValidation";
import { validateRequest } from "../../../StandardMiddleware/RequestBodyValidator";
import { loginUser, saveFcmToken, sendOtpToUser } from "../Controller/CommonController";
import { authenticateUserToken } from "../../../StandardMiddleware/TokenAuthentication";
import upload from "../../../StandardUtility/MulterConfig";
import { checkUploadFiles } from "../../Vendor/Middleware/CheckRequiredFiles";
import { vendorUpdateProfileValidation } from "../../Vendor/RequestValidator/VendorValidator";
import { vendorProfileUpdate } from "../../Vendor/Controller/VendorController";
import { registerDriverValidation } from "../../Driver/RequestValidation/DriverValidation";
import { driverProfileUpdateAndRegistration } from "../../Driver/Controller/DriverController";
import { addFcmTokenValidation } from "../RequestValidator/CommonValidator";

const router = express.Router();

export const checkMultipartFormData = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (!req.is('multipart/form-data')) {
        res.status(400).json({ message: 'Content-Type must be multipart/form-data' });
        return;
    }
    next();
};

router.post("/send-otp", userOtpValidation, validateRequest, sendOtpToUser);

router.post("/validateLogin", userLoginValidation, validateRequest, loginUser);

router.post("/vendor/update-profile", authenticateUserToken, upload.fields([{ name: 'tradeLicense', maxCount: 1 }, { name: 'GSTFile', maxCount: 1 }, { name: 'storeImage', maxCount: 1 }]),
    checkUploadFiles(['tradeLicense', 'GSTFile']), vendorUpdateProfileValidation, validateRequest, checkMultipartFormData, vendorProfileUpdate)

router.post("/driver/update-profile", authenticateUserToken, upload.fields([{ name: 'drivingLicense', maxCount: 1 }, { name: 'vehicleImage', maxCount: 1 }]),
    checkUploadFiles(['drivingLicense', 'vehicleImage']), registerDriverValidation, validateRequest, checkMultipartFormData, driverProfileUpdateAndRegistration)

router.post("/save-fcmtoken", addFcmTokenValidation, validateRequest, saveFcmToken);

export default router;
