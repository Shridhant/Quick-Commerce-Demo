import { Request, Response } from "express";
import { savePushTokenService, sendOTP, verifyAndLogin } from "../../../StandardUtility/CommonService";
import { HttpStatusCode } from "../../../StandardUtility/HttpStatusCode";



export const loginUser = async (req: Request, res: Response) => {
  const { phone, otp } = req.body;
  try {
    const response = await verifyAndLogin(otp, phone);
    res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    throw err;
  }

};


export const sendOtpToUser = async (req: Request, res: Response) => {
  const { phone } = req.body;
  try {
    const response = await sendOTP(phone);
    res.status(HttpStatusCode.OK).json(response)
  } catch (err) {
    throw err;
  }

};

export const saveFcmToken = async (req: Request, res: Response) => {
  const { fcmToken, user_type, appType, deviceType,device_id,phone,user_id } = req.body;
  try {

    const response = await savePushTokenService(fcmToken,user_type,appType,deviceType,device_id,phone,user_id);
    res.status(HttpStatusCode.OK).json(response)
  } catch (err) {
    throw err;
  }
};
