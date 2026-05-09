import multer, { FileFilterCallback } from "multer";
import path from "path";
import { Request } from "express";


const storage = multer.memoryStorage();

const allowedTypes = [".pdf", ".jpg", ".jpeg", ".png"];

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type!"));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter,
});

export default upload;
