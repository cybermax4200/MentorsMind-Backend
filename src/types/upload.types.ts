/**
 * Type definitions for the file upload service
 */

export interface FileUploadRecord {
  id: string;
  fileKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploaderId: string;
  cdnUrl: string;
  createdAt: Date;
}
