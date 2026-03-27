import multer, { FileFilterCallback, memoryStorage } from "multer";
import { Request } from "express";

const AVATAR_ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DOCUMENT_ALLOWED_MIME_TYPES = ["application/pdf"];

const MB = 1024 * 1024;

const avatarFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void => {
  if (AVATAR_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("INVALID_MIME_TYPE"));
  }
};

const documentFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void => {
  if (DOCUMENT_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("INVALID_MIME_TYPE"));
  }
};

/**
 * Multer instance for avatar uploads.
 * Accepts: image/jpeg, image/png, image/webp
 * Size limit: 5 MB
 * Storage: memory (buffer available at req.file.buffer)
 */
export const avatarUpload = multer({
  storage: memoryStorage(),
  fileFilter: avatarFileFilter,
  limits: {
    fileSize: 5 * MB,
  },
});

/**
 * Multer instance for document uploads.
 * Accepts: application/pdf
 * Size limit: 20 MB
 * Storage: memory (buffer available at req.file.buffer)
 */
export const documentUpload = multer({
  storage: memoryStorage(),
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 20 * MB,
  },
});
