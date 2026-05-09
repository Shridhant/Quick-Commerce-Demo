import jwt,{JwtPayload} from 'jsonwebtoken';
import { Request,Response,NextFunction } from 'express';
import { HttpStatusCode } from '../../../StandardUtility/HttpStatusCode';
import { ACCESS_TOKEN_SECRET } from '../../StandardConfig/SettingsReader';

interface AuthenticatedDriverRequest extends Request {
  driver?: string | JwtPayload;
}

export const authenticateDriverToken = (
  req: AuthenticatedDriverRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(HttpStatusCode.UNAUTHORIZED).json({ message: 'Token not found' });
    return;
  }

  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, driver) => {
    if (err) {
      console.error('❌ JWT Verification Error:', err.message);
      res.status(HttpStatusCode.FORBIDDEN).json({ message: 'Invalid Token' });
      return;
    }
    
    // Debug: Log the entire payload structure
    console.log('🔍 DEBUG - JWT Payload:', JSON.stringify(driver, null, 2));
    console.log('🔍 DEBUG - Has driverId?', !!(driver as any)?.driverId);
    console.log('🔍 DEBUG - Payload keys:', Object.keys(driver || {}));
    
    req.driver = driver;
    next();
  });
};