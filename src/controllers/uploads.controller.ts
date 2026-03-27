import { Response } from "express";
import { AuthenticatedRequest } from "../types/api.types";
import { UploadService } from "../services/upload.service";
import { ResponseUtil } from "../utils/response.utils";
import { asyncHandler } from "../utils/asyncHandler.utils";
import { createError } from "../middleware/errorHandler";

export const UploadsController = {
  /**
   * POST /api/v1/uploads/avatar
   * Upload an avatar image for the authenticated user
   */
  uploadAvatar: asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      if (!req.file) {
        throw createError("No file provided", 400);
      }
      const result = await UploadService.uploadAvatar(req.file, req.user!.id);
      return ResponseUtil.created(res, result);
    },
  ),

  /**
   * POST /api/v1/uploads/document
   * Upload a document for the authenticated user
   */
  uploadDocument: asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      if (!req.file) {
        throw createError("No file provided", 400);
      }
      const result = await UploadService.uploadDocument(req.file, req.user!.id);
      return ResponseUtil.created(res, result);
    },
  ),

  /**
   * DELETE /api/v1/uploads/:key
   * Delete a file by its storage key
   */
  deleteFile: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const fileKey = req.params.key as string;
    await UploadService.deleteFile(fileKey);
    return ResponseUtil.success(res, { message: "File deleted successfully" });
  }),
};
