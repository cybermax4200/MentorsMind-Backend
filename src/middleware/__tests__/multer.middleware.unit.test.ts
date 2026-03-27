import express, { Request, Response } from "express";
import supertest from "supertest";
import { avatarUpload, documentUpload } from "../multer.middleware";

// Helper to build a minimal express app with a multer middleware
function makeApp(upload: ReturnType<typeof avatarUpload.single>) {
  const app = express();
  app.post("/upload", upload, (req: Request, res: Response) => {
    res.status(200).json({ ok: true, mimetype: (req as any).file?.mimetype });
  });
  // Multer error handler
  app.use((err: any, _req: Request, res: Response, _next: any) => {
    if (err?.message === "INVALID_MIME_TYPE") {
      return res.status(415).json({ error: err.message });
    }
    if (err?.code === "LIMIT_FILE_SIZE") {
      return res.status(422).json({ error: "File too large" });
    }
    res.status(500).json({ error: err?.message ?? "Unknown error" });
  });
  return app;
}

const TINY_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U" +
    "HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgN" +
    "DRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy" +
    "MjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAA" +
    "AAAAAAAAAAAAAP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA" +
    "/9oADAMBAAIRAxEAPwCwABmX/9k=",
  "base64",
);

describe("multer.middleware — avatarUpload", () => {
  const app = makeApp(avatarUpload.single("file"));

  it("accepts image/jpeg", async () => {
    const res = await supertest(app)
      .post("/upload")
      .attach("file", TINY_JPEG, {
        filename: "photo.jpg",
        contentType: "image/jpeg",
      });
    expect(res.status).toBe(200);
  });

  it("accepts image/png", async () => {
    // Minimal 1×1 PNG
    const PNG = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64",
    );
    const res = await supertest(app)
      .post("/upload")
      .attach("file", PNG, { filename: "photo.png", contentType: "image/png" });
    expect(res.status).toBe(200);
  });

  it("accepts image/webp", async () => {
    // Minimal WebP (12-byte RIFF header + VP8L chunk)
    const WEBP = Buffer.from(
      "UklGRlYAAABXRUJQVlA4IEoAAADQAQCdASoBAAEAAkA4JZQCdAEO/gHOAAD++P/Z",
      "base64",
    );
    const res = await supertest(app)
      .post("/upload")
      .attach("file", WEBP, {
        filename: "photo.webp",
        contentType: "image/webp",
      });
    expect(res.status).toBe(200);
  });

  it("rejects application/pdf with 415", async () => {
    const res = await supertest(app)
      .post("/upload")
      .attach("file", Buffer.from("%PDF-1.4"), {
        filename: "doc.pdf",
        contentType: "application/pdf",
      });
    expect(res.status).toBe(415);
  });

  it("rejects text/plain with 415", async () => {
    const res = await supertest(app)
      .post("/upload")
      .attach("file", Buffer.from("hello"), {
        filename: "file.txt",
        contentType: "text/plain",
      });
    expect(res.status).toBe(415);
  });

  it("rejects files over 5 MB with 422", async () => {
    const bigBuffer = Buffer.alloc(6 * 1024 * 1024, 0xff);
    const res = await supertest(app)
      .post("/upload")
      .attach("file", bigBuffer, {
        filename: "big.jpg",
        contentType: "image/jpeg",
      });
    expect(res.status).toBe(422);
  });
});

describe("multer.middleware — documentUpload", () => {
  const app = makeApp(documentUpload.single("file"));

  it("accepts application/pdf", async () => {
    const res = await supertest(app)
      .post("/upload")
      .attach("file", Buffer.from("%PDF-1.4 minimal"), {
        filename: "doc.pdf",
        contentType: "application/pdf",
      });
    expect(res.status).toBe(200);
  });

  it("rejects image/jpeg with 415", async () => {
    const res = await supertest(app)
      .post("/upload")
      .attach("file", TINY_JPEG, {
        filename: "photo.jpg",
        contentType: "image/jpeg",
      });
    expect(res.status).toBe(415);
  });

  it("rejects text/plain with 415", async () => {
    const res = await supertest(app)
      .post("/upload")
      .attach("file", Buffer.from("hello"), {
        filename: "file.txt",
        contentType: "text/plain",
      });
    expect(res.status).toBe(415);
  });

  it("rejects files over 20 MB with 422", async () => {
    const bigBuffer = Buffer.alloc(21 * 1024 * 1024, 0xff);
    const res = await supertest(app)
      .post("/upload")
      .attach("file", bigBuffer, {
        filename: "big.pdf",
        contentType: "application/pdf",
      });
    expect(res.status).toBe(422);
  });
});
