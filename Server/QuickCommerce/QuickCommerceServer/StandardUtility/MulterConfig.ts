import multer, { FileFilterCallback } from "multer";
import path from "path";
import { Request } from "express";

// Use memory storage
const storage = multer.memoryStorage();

// Allowed extensions
const allowedTypes = [".pdf", ".jpg", ".jpeg", ".png"];

// File filter with correct TS types
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true); // Accept
  } else {
    cb(new Error("Invalid file type!"));
  }
};

// Multer config
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter,
});

export default upload;
