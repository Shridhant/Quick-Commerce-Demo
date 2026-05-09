import path from "path";
import fs from "fs/promises"; 

interface UploadedFile {
  originalname: string;
  fieldname: string;
  buffer: Buffer;
}

export const saveUploadedFile = async (
  file: UploadedFile,
  rootFolder: string,
  id : string,
): Promise<string> => {
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const fileExt = path.extname(file.originalname);
  const fileName = `${id}-${file.fieldname}-${uniqueSuffix}${fileExt}`;
  const uploadFolder = `${rootFolder}/${file.fieldname}`;
  const filePath = path.join(uploadFolder, fileName);

  try {
    await fs.mkdir(uploadFolder, { recursive: true }); // Creates directory if it doesn't exist
    await fs.writeFile(filePath, file.buffer); // Write file to disk asynchronously
    return fileName;
  } catch (err) {
    throw new Error(`Error saving file: ${(err as Error).message}`);
  }
};
