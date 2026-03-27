import sharp from "sharp";
import { resizeAvatar, ImageProcessingError } from "../image.utils";

/** Create a real image buffer of given dimensions and format using sharp */
async function makeImage(
  width: number,
  height: number,
  format: "jpeg" | "png" | "webp",
): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 100, g: 150, b: 200 },
    },
  })
    [format]()
    .toBuffer();
}

describe("resizeAvatar", () => {
  describe("output dimensions", () => {
    it("keeps a 100×100 image within 512×512", async () => {
      const buf = await makeImage(100, 100, "jpeg");
      const out = await resizeAvatar(buf, "image/jpeg");
      const meta = await sharp(out).metadata();
      expect(meta.width).toBeLessThanOrEqual(512);
      expect(meta.height).toBeLessThanOrEqual(512);
    });

    it("downscales a 1024×768 image to fit within 512×512", async () => {
      const buf = await makeImage(1024, 768, "jpeg");
      const out = await resizeAvatar(buf, "image/jpeg");
      const meta = await sharp(out).metadata();
      expect(meta.width).toBeLessThanOrEqual(512);
      expect(meta.height).toBeLessThanOrEqual(512);
    });

    it("preserves aspect ratio within 0.01 tolerance for a wide image", async () => {
      const buf = await makeImage(800, 400, "jpeg"); // 2:1 ratio
      const out = await resizeAvatar(buf, "image/jpeg");
      const meta = await sharp(out).metadata();
      const inputRatio = 800 / 400;
      const outputRatio = meta.width! / meta.height!;
      expect(Math.abs(inputRatio - outputRatio)).toBeLessThanOrEqual(0.01);
    });

    it("preserves aspect ratio within 0.01 tolerance for a tall image", async () => {
      const buf = await makeImage(300, 600, "png"); // 1:2 ratio
      const out = await resizeAvatar(buf, "image/png");
      const meta = await sharp(out).metadata();
      const inputRatio = 300 / 600;
      const outputRatio = meta.width! / meta.height!;
      expect(Math.abs(inputRatio - outputRatio)).toBeLessThanOrEqual(0.01);
    });
  });

  describe("format round-trip", () => {
    it("outputs jpeg for image/jpeg input", async () => {
      const buf = await makeImage(200, 200, "jpeg");
      const out = await resizeAvatar(buf, "image/jpeg");
      const meta = await sharp(out).metadata();
      expect(meta.format).toBe("jpeg");
    });

    it("outputs png for image/png input", async () => {
      const buf = await makeImage(200, 200, "png");
      const out = await resizeAvatar(buf, "image/png");
      const meta = await sharp(out).metadata();
      expect(meta.format).toBe("png");
    });

    it("outputs webp for image/webp input", async () => {
      const buf = await makeImage(200, 200, "webp");
      const out = await resizeAvatar(buf, "image/webp");
      const meta = await sharp(out).metadata();
      expect(meta.format).toBe("webp");
    });
  });

  describe("error handling", () => {
    it("throws ImageProcessingError on corrupt buffer", async () => {
      const corrupt = Buffer.from("not-an-image-at-all");
      await expect(resizeAvatar(corrupt, "image/jpeg")).rejects.toThrow(
        ImageProcessingError,
      );
    });

    it("throws ImageProcessingError for unsupported MIME type", async () => {
      const buf = await makeImage(100, 100, "jpeg");
      await expect(resizeAvatar(buf, "image/gif")).rejects.toThrow(
        ImageProcessingError,
      );
    });
  });
});
