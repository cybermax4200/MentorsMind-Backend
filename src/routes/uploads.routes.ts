import { Router, IRouter } from "express";
import { UploadsController } from "../controllers/uploads.controller";
import { authenticate } from "../middleware/auth.middleware";
import { avatarUpload, documentUpload } from "../middleware/multer.middleware";

const router: IRouter = Router();

/**
 * @swagger
 * /uploads/avatar:
 *   post:
 *     summary: Upload an avatar image
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Avatar uploaded successfully
 *       400:
 *         description: No file provided or invalid file type
 *       401:
 *         description: Authentication required
 */
router.post(
  "/avatar",
  avatarUpload.single("file"),
  authenticate,
  UploadsController.uploadAvatar,
);

/**
 * @swagger
 * /uploads/document:
 *   post:
 *     summary: Upload a document
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *       400:
 *         description: No file provided or invalid file type
 *       401:
 *         description: Authentication required
 */
router.post(
  "/document",
  documentUpload.single("file"),
  authenticate,
  UploadsController.uploadDocument,
);

/**
 * @swagger
 * /uploads/{key}:
 *   delete:
 *     summary: Delete a file by its storage key
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: File not found
 */
router.delete("/:key", authenticate, UploadsController.deleteFile);

export default router;
