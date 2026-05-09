import jwt,{JwtPayload} from 'jsonwebtoken';
import { Request,Response,NextFunction } from 'express';
import { AuthenticatedCustomerRequest } from '../Utility/CustomPayload';
import { HttpStatusCode } from '../Config/HttpStatusCode';
import { ACCESS_TOKEN_SECRET } from '../Config/SettingReader';


interface AuthenticatedRequest extends Request {
  customer?: string | JwtPayload;
}

export const AuthenticateCustomerToken = (
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

  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, customer) => {
    if (err) {
      res.status(HttpStatusCode.FORBIDDEN).json({ message: 'Invalid Token' });
      return;
    }
    req.customer = customer;
    next();
  });
};