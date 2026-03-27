import fs from "fs";
import path from "path";
import pool from "../config/database";
import { TokenUtils } from "../utils/token.utils";
import { enqueueEmail } from "../queues/email.queue";
import { AuditLoggerService } from "./audit-logger.service";
import { LogLevel } from "../utils/log-formatter.utils";
import {
  InvalidTokenError,
  TokenExpiredError,
  AlreadyVerifiedError,
} from "../errors/email-verification.errors";

export interface VerificationTokenRecord {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}

const BASE_URL =
  process.env.BASE_URL || process.env.APP_URL || "http://localhost:3000";

/** Interpolate {{key}} placeholders in a template string. */
function interpolate(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? "");
}

/** Read an email template file from disk. */
function readTemplate(filename: string): string {
  return fs.readFileSync(
    path.join(__dirname, "../templates/emails", filename),
    "utf-8",
  );
}

export const EmailVerificationService = {
  /**
   * Generate a verification token, invalidate old tokens for the user,
   * persist the new token, and enqueue the verification email.
   * Logs VERIFICATION_EMAIL_SENT on success.
   */
  async sendVerificationEmail(
    userId: string,
    email: string,
    firstName: string,
  ): Promise<void> {
    const { rawToken, tokenHash, expiresAt } = TokenUtils.generateToken();

    // Invalidate all active tokens for this user
    await pool.query(
      `UPDATE email_verification_tokens
         SET used_at = NOW()
       WHERE user_id = $1 AND used_at IS NULL`,
      [userId],
    );

    // Insert the new token record
    await pool.query(
      `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, tokenHash, expiresAt],
    );

    // Build the verification URL
    const verificationUrl = `${BASE_URL}/api/v1/auth/verify-email?token=${rawToken}`;
    const templateData = {
      firstName,
      verificationUrl,
      expiryHours: "24",
    };

    // Read and interpolate templates
    const htmlContent = interpolate(
      readTemplate("verify-email.html"),
      templateData,
    );
    const textContent = interpolate(
      readTemplate("verify-email.txt"),
      templateData,
    );

    // Enqueue the email
    await enqueueEmail({
      to: [email],
      subject: "Verify Your Email Address – MentorMinds",
      htmlContent,
      textContent,
    });

    // Audit log
    await AuditLoggerService.logEvent({
      level: LogLevel.INFO,
      action: "VERIFICATION_EMAIL_SENT",
      message: `Verification email enqueued for user ${userId}`,
      userId,
      entityType: "user",
      entityId: userId,
    });
  },

  /**
   * Validate a raw verification token, mark the user as verified, and
   * mark the token as used.
   *
   * Returns { userId, alreadyVerified: true } if the user was already verified,
   * or { userId, alreadyVerified: false } after a successful first verification.
   *
   * Throws InvalidTokenError for missing/used tokens.
   * Throws TokenExpiredError for expired tokens.
   */
  async verifyToken(
    rawToken: string,
  ): Promise<{ userId: string; alreadyVerified: boolean }> {
    const tokenHash = TokenUtils.hashToken(rawToken);

    // Look up the token record
    const tokenResult = await pool.query<VerificationTokenRecord>(
      `SELECT id, user_id, token_hash, expires_at, used_at, created_at
         FROM email_verification_tokens
        WHERE token_hash = $1`,
      [tokenHash],
    );

    if (tokenResult.rows.length === 0) {
      throw new InvalidTokenError();
    }

    const token = tokenResult.rows[0];

    // Already used?
    if (token.used_at !== null) {
      throw new InvalidTokenError();
    }

    // Expired?
    if (TokenUtils.isExpired(token.expires_at)) {
      await AuditLoggerService.logEvent({
        level: LogLevel.WARN,
        action: "VERIFICATION_TOKEN_EXPIRED",
        message: `Expired verification token used for user ${token.user_id}`,
        userId: token.user_id,
        entityType: "user",
        entityId: token.user_id,
      });
      throw new TokenExpiredError();
    }

    // Check if user is already verified
    const userResult = await pool.query<{ email_verified: boolean }>(
      `SELECT email_verified FROM users WHERE id = $1`,
      [token.user_id],
    );

    if (userResult.rows[0]?.email_verified) {
      return { userId: token.user_id, alreadyVerified: true };
    }

    // Mark user as verified
    await pool.query(`UPDATE users SET email_verified = true WHERE id = $1`, [
      token.user_id,
    ]);

    // Mark token as used
    await pool.query(
      `UPDATE email_verification_tokens SET used_at = NOW() WHERE id = $1`,
      [token.id],
    );

    // Audit log
    await AuditLoggerService.logEvent({
      level: LogLevel.INFO,
      action: "EMAIL_VERIFIED",
      message: `Email verified for user ${token.user_id}`,
      userId: token.user_id,
      entityType: "user",
      entityId: token.user_id,
    });

    return { userId: token.user_id, alreadyVerified: false };
  },

  /**
   * Resend a verification email for the given email address.
   *
   * - If the email is not found, returns silently (no error, no information leak).
   * - If the user is already verified, throws AlreadyVerifiedError.
   * - Otherwise calls sendVerificationEmail and logs VERIFICATION_EMAIL_RESENT.
   */
  async resendVerificationEmail(email: string): Promise<void> {
    // Look up user by email
    const userResult = await pool.query<{
      id: string;
      first_name: string;
      email_verified: boolean;
    }>(`SELECT id, first_name, email_verified FROM users WHERE email = $1`, [
      email,
    ]);

    // Silent return if user not found (no information leak)
    if (userResult.rows.length === 0) {
      return;
    }

    const user = userResult.rows[0];

    // Already verified?
    if (user.email_verified) {
      throw new AlreadyVerifiedError();
    }

    // Send a fresh verification email
    await this.sendVerificationEmail(user.id, email, user.first_name);

    // Audit log
    await AuditLoggerService.logEvent({
      level: LogLevel.INFO,
      action: "VERIFICATION_EMAIL_RESENT",
      message: `Verification email resent for user ${user.id}`,
      userId: user.id,
      entityType: "user",
      entityId: user.id,
    });
  },
};
