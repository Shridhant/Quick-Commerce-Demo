import jwt,{JwtPayload} from 'jsonwebtoken';
import { Request,Response,NextFunction } from 'express';
import { HttpStatusCode } from '../../../StandardUtility/HttpStatusCode';
import { ACCESS_TOKEN_SECRET } from '../../StandardConfig/SettingsReader';

interface AuthenticatedRequest extends Request {
  vendor?: string | JwtPayload;
}

export const authenticateVendorToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(HttpStatusCode.UNAUTHORIZED).json({ message: 'Token not found' });
    return;
  }

  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, vendor) => {
    if (err) {
      res.status(HttpStatusCode.FORBIDDEN).json({ message: 'Invalid Token' });
      return;
    }
    req.vendor = vendor;
    next();
  });
};