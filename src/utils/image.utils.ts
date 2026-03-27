import sharp from "sharp";

export class ImageProcessingError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ImageProcessingError";
  }
}

/**
 * Resizes an avatar image to fit within 512×512 px (preserving aspect ratio)
 * and re-encodes it in the same format as the input.
 *
 * @param buffer   Raw image bytes
 * @param mimeType One of image/jpeg, image/png, image/webp
 * @returns        Processed image buffer
 * @throws         ImageProcessingError on any failure
 */
export async function resizeAvatar(
  buffer: Buffer,
  mimeType: string,
): Promise<Buffer> {
  try {
    const pipeline = sharp(buffer).resize(512, 512, {
      fit: "inside",
      withoutEnlargement: false,
    });

    switch (mimeType) {
      case "image/jpeg":
        return await pipeline.jpeg({ quality: 80 }).toBuffer();
      case "image/webp":
        return await pipeline.webp({ quality: 80 }).toBuffer();
      case "image/png":
        return await pipeline.png({ compressionLevel: 8 }).toBuffer();
      default:
        throw new ImageProcessingError(`Unsupported MIME type: ${mimeType}`);
    }
  } catch (err) {
    if (err instanceof ImageProcessingError) {
      throw err;
    }
    throw new ImageProcessingError(
      `Failed to process image: ${err instanceof Error ? err.message : String(err)}`,
      err,
    );
  }
}
