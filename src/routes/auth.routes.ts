import { Router } from "express";
import rateLimit from "express-rate-limit";
import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Apply stricter rate limiting for auth endpoints to prevent brute force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs for auth routes
  message: {
    success: false,
    error: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Per-email rate limiter for resend verification (3 requests per hour)
const resendVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  keyGenerator: (req) => (req.body?.email as string) || req.ip || "unknown",
  message: {
    success: false,
    error: "Too many resend requests, please try again later.",
  },
  standardHeaders: true, // sends RateLimit-* headers including Retry-After
  legacyHeaders: false,
});

// Public routes (rate limited)
router.post("/register", authLimiter, AuthController.register);
router.post("/login", authLimiter, AuthController.login);
router.post("/refresh", authLimiter, AuthController.refresh);
router.post("/forgot-password", authLimiter, AuthController.forgotPassword);
router.post("/reset-password", authLimiter, AuthController.resetPassword);
router.get("/verify-email", authLimiter, AuthController.verifyEmail);
router.post(
  "/resend-verification",
  resendVerificationLimiter,
  AuthController.resendVerification,
);

// Protected routes (no strict rate limiting required beyond global)
router.post("/logout", authenticate, AuthController.logout);
router.get("/me", authenticate, AuthController.getMe);

export default router;
