import crypto from "crypto";

export interface GeneratedToken {
  /** URL-safe hex string sent to the user */
  rawToken: string;
  /** SHA-256 hex stored in DB — never the raw value */
  tokenHash: string;
  /** Expiry timestamp: exactly 24 hours after generation */
  expiresAt: Date;
}

const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const TokenUtils = {
  /**
   * Generate a cryptographically secure verification token.
   * - `rawToken`: 32 random bytes encoded as a 64-char hex string (URL-safe)
   * - `tokenHash`: SHA-256 hex of the raw token (stored in DB)
   * - `expiresAt`: current time + 24 hours
   */
  generateToken(): GeneratedToken {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + EXPIRY_MS);
    return { rawToken, tokenHash, expiresAt };
  },

  /**
   * Compute the SHA-256 hex digest of a raw token string.
   * Pure function — no side effects.
   */
  hashToken(rawToken: string): string {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
  },

  /**
   * Return true if the given expiry date is in the past.
   */
  isExpired(expiresAt: Date): boolean {
    return expiresAt.getTime() < Date.now();
  },
};
