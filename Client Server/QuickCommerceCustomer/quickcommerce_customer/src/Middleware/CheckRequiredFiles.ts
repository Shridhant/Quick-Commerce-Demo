import { Request, Response, NextFunction } from 'express';

export const checkUploadFiles = (requiredFields: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    const missingFiles = requiredFields.filter((field) => {
      const file = files?.[field];
      return !file || file.length === 0;
    });

    if (missingFiles.length > 0) {
      res
        .status(400)
        .json({ message: `Missing required files: ${missingFiles.join(', ')}` });
      return;
    }
    next();
  };
};
