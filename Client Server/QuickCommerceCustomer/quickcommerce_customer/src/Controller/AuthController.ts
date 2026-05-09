import { Request, Response } from "express";
import { insertErrorLog, insertLogs, sendOTP } from "../Service/CommonService";
import { HttpStatusCode } from "../Config/HttpStatusCode";
import { verifyAndLogin } from "../Service/AuthService";

export const sendOtpToCustomer = async (req: Request, res: Response) => {
  const { phone } = req.body;
  try {
    const response = await sendOTP(phone);
    res.status(HttpStatusCode.OK).json(response)
  } catch (err) {
    throw err;
  }

};

export const loginCustomer = async (req: Request, res: Response) => {
  const { phone, otp } = req.body;
  try {
   const response = await verifyAndLogin(otp, phone);
   res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    throw err;
  }

};

export const updateCustomerProfile = async (req: Request, res: Response) => {
    const {
      name,
      email,
      address: {
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        latitude,
        longitude,
      } = {},
    } = req.body;
  try {
   
    console.log(name,email,address_line1,address_line2,city,state,postal_code,latitude,longitude)
   res.status(HttpStatusCode.OK).json("response");
  } catch (err) {
    throw err;
  }

};


