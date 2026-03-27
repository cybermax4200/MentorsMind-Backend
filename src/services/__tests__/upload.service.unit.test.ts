/**
 * Unit tests for upload.service.ts
 * Mocks: pool (database), fs.promises (local storage), resizeAvatar (image utils)
 */

// ---------------------------------------------------------------------------
// Mocks — must be declared before imports
// ---------------------------------------------------------------------------

// uuid is pure ESM — mock it so the CJS unit test runner can load it
jest.mock("uuid", () => ({
  v4: jest.fn(() => "test-uuid-1234-5678-abcd-ef0123456789"),
}));

jest.mock("../../config/database", () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
    connect: jest.fn(),
  },
}));

jest.mock("fs", () => {
  const actual = jest.requireActual("fs");
  return {
    ...actual,
    promises: {
      mkdir: jest.fn().mockResolvedValue(undefined),
      writeFile: jest.fn().mockResolvedValue(undefined),
      unlink: jest.fn().mockResolvedValue(undefined),
    },
  };
});

jest.mock("../../utils/image.utils", () => ({
  resizeAvatar: jest.fn(),
}));

// Mock env so STORAGE_BACKEND is always 'local' and CDN_BASE_URL is predictable
jest.mock("../../config/env", () => ({
  env: {
    STORAGE_BACKEND: "local",
    LOCAL_UPLOAD_DIR: "/tmp/test-uploads",
    CDN_BASE_URL: "http://localhost:5000/uploads",
  },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import fs from "fs";
import pool from "../../config/database";
import { resizeAvatar } from "../../utils/image.utils";
import { UploadService } from "../upload.service";

// ---------------------------------------------------------------------------
// Typed mock helpers
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPoolQuery = pool.query as jest.MockedFunction<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPoolConnect = pool.connect as jest.MockedFunction<any>;
const mockResizeAvatar = resizeAvatar as jest.MockedFunction<
  typeof resizeAvatar
>;
const mockFsPromises = fs.promises as jest.Mocked<typeof fs.promises>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFile(
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File {
  return {
    fieldname: "file",
    originalname: "photo.jpg",
    encoding: "7bit",
    mimetype: "image/jpeg",
    buffer: Buffer.from("fake-image-data"),
    size: 1024,
    stream: null as any,
    destination: "",
    filename: "",
    path: "",
    ...overrides,
  };
}

const UPLOADER_ID = "user-uuid-1234";
const PROCESSED_BUFFER = Buffer.from("processed-image-data");

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("UploadService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // uploadAvatar
  // -------------------------------------------------------------------------

  describe("uploadAvatar", () => {
    it("happy path — returns UploadResult with correct fields", async () => {
      mockResizeAvatar.mockResolvedValue(PROCESSED_BUFFER);
      mockFsPromises.mkdir.mockResolvedValue(undefined);
      mockFsPromises.writeFile.mockResolvedValue(undefined);
      mockPoolQuery.mockResolvedValue({ rows: [], rowCount: 1 });

      const file = makeFile({
        originalname: "avatar.jpg",
        mimetype: "image/jpeg",
      });
      const result = await UploadService.uploadAvatar(file, UPLOADER_ID);

      expect(result.fileKey).toMatch(/^avatars\//);
      expect(result.cdnUrl).toMatch(
        /^http:\/\/localhost:5000\/uploads\/avatars\//,
      );
      expect(result.originalName).toBe("avatar.jpg");
      expect(result.mimeType).toBe("image/jpeg");
      expect(result.sizeBytes).toBe(PROCESSED_BUFFER.length);
    });

    it("DB failure — triggers storage.delete (compensating transaction) and throws 500", async () => {
      mockResizeAvatar.mockResolvedValue(PROCESSED_BUFFER);
      mockFsPromises.mkdir.mockResolvedValue(undefined);
      mockFsPromises.writeFile.mockResolvedValue(undefined);
      mockFsPromises.unlink.mockResolvedValue(undefined);
      mockPoolQuery.mockRejectedValue(new Error("DB connection lost"));

      const file = makeFile();
      await expect(
        UploadService.uploadAvatar(file, UPLOADER_ID),
      ).rejects.toMatchObject({
        statusCode: 500,
      });

      // Compensating transaction: unlink should have been called
      expect(mockFsPromises.unlink).toHaveBeenCalledTimes(1);
    });

    it("storage failure — throws 503", async () => {
      mockResizeAvatar.mockResolvedValue(PROCESSED_BUFFER);
      mockFsPromises.mkdir.mockResolvedValue(undefined);
      mockFsPromises.writeFile.mockRejectedValue(new Error("Disk full"));

      const file = makeFile();
      await expect(
        UploadService.uploadAvatar(file, UPLOADER_ID),
      ).rejects.toMatchObject({
        statusCode: 503,
      });

      // DB should never be called
      expect(mockPoolQuery).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // uploadDocument
  // -------------------------------------------------------------------------

  describe("uploadDocument", () => {
    it("happy path — returns UploadResult with correct fields", async () => {
      mockFsPromises.mkdir.mockResolvedValue(undefined);
      mockFsPromises.writeFile.mockResolvedValue(undefined);
      mockPoolQuery.mockResolvedValue({ rows: [], rowCount: 1 });

      const file = makeFile({
        originalname: "resume.pdf",
        mimetype: "application/pdf",
        buffer: Buffer.from("%PDF-1.4 content"),
        size: 2048,
      });
      const result = await UploadService.uploadDocument(file, UPLOADER_ID);

      expect(result.fileKey).toMatch(/^documents\//);
      expect(result.cdnUrl).toMatch(
        /^http:\/\/localhost:5000\/uploads\/documents\//,
      );
      expect(result.originalName).toBe("resume.pdf");
      expect(result.mimeType).toBe("application/pdf");
      expect(result.sizeBytes).toBe(2048);
    });
  });

  // -------------------------------------------------------------------------
  // deleteFile
  // -------------------------------------------------------------------------

  describe("deleteFile", () => {
    it("throws 404 when file key not found", async () => {
      mockPoolQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      await expect(
        UploadService.deleteFile("avatars/nonexistent-key"),
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("happy path — deletes from storage and DB", async () => {
      const fileKey = "avatars/some-uuid";

      // First query: SELECT (lookup)
      mockPoolQuery.mockResolvedValue({
        rows: [{ file_key: fileKey }],
        rowCount: 1,
      });

      // pool.connect returns a client mock
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce(undefined) // DELETE
        .mockResolvedValueOnce(undefined); // COMMIT
      mockPoolConnect.mockResolvedValue(mockClient);

      mockFsPromises.unlink.mockResolvedValue(undefined);

      await expect(UploadService.deleteFile(fileKey)).resolves.toBeUndefined();

      expect(mockFsPromises.unlink).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM file_uploads"),
        [fileKey],
      );
      expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});
