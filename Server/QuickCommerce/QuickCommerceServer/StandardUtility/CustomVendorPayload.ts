import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";

interface MyVendorPayload extends JwtPayload {
  vendorId: string;
  purpose: string;
}

export interface AuthenticatedVendorRequest extends Request {
  vendor?: MyVendorPayload;
}

interface MyUserPayload extends JwtPayload {
  phone: string;
  purpose: string;
}

export interface AuthenticatedUserRequest extends Request {
  user?: MyUserPayload;
}

interface MyDriverPayload extends JwtPayload {
  driverId: string;  // Fixed: was 'driverID' (incorrect casing)
  purpose: string;
}

export interface AuthenticatedDriverRequest extends Request {
  driver?: MyDriverPayload;
}

interface AdminPayload extends JwtPayload {
  adminId: string;
  name: string;
  role : string;
  email: string;
  assignedWarehouse?: string | null;
}

export interface AuthenticatedAdminRequest extends Request {
  admin?: MyDriverPayload;
}


