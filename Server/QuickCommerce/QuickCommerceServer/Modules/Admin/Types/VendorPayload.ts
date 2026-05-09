import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";

interface MyVendorPayload extends JwtPayload {
  vendorId: string;
  purpose: string;
}

export interface AuthenticatedVendorRequest extends Request {
  vendor?: MyVendorPayload;
}