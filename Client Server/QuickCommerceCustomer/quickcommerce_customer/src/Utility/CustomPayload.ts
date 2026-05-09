import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";

interface CustomerPayload extends JwtPayload {
  customerId: string;
  purpose: string;
}

export interface AuthenticatedCustomerRequest extends Request {
  customer?: CustomerPayload;
}