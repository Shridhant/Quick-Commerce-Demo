import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { HttpStatusCode } from "../../../StandardUtility/HttpStatusCode";
import { ACCESS_TOKEN_SECRET } from "../../StandardConfig/SettingsReader";

export interface AdminPayload extends JwtPayload {
  adminId: number;
  name: string;
  role: string;
  email: string;
  assignedWarehouse: string | null;
}

export interface AuthenticatedRequest extends Request {
  admin?: AdminPayload;
}

export const authenticateAdminToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    res
      .status(HttpStatusCode.UNAUTHORIZED)
      .json({ message: "Token not found" });
    return;
  }

  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      // Differentiate between expired and invalid tokens
      if (err.name === "TokenExpiredError") {
        res.status(HttpStatusCode.UNAUTHORIZED).json({ message: "Token expired", code: "TOKEN_EXPIRED" });
      } else {
        res.status(HttpStatusCode.FORBIDDEN).json({ message: "Invalid Token" });
      }
      return;
    }

    const admin = decoded as AdminPayload;

    if (admin.role !== "ADMIN" && admin.role !== "SUPERADMIN") {
      res.status(HttpStatusCode.FORBIDDEN).json({ message: "Access Denied" });
      return;
    }

    req.admin = admin;
    next();
  });
};

