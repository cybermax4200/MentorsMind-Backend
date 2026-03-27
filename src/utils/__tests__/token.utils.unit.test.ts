import { TokenUtils } from "../token.utils";

/**
 * Unit tests for TokenUtils
 * Validates: Requirements 1.1, 1.2, 1.3
 */
describe("TokenUtils", () => {
  describe("generateToken", () => {
    it("returns a rawToken that is a 64-char hex string", () => {
      const { rawToken } = TokenUtils.generateToken();
      expect(rawToken).toMatch(/^[0-9a-f]{64}$/);
    });

    it("returns a tokenHash that is a 64-char hex string", () => {
      const { tokenHash } = TokenUtils.generateToken();
      expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);
    });

    it("returns an expiresAt approximately 24 hours from now", () => {
      const before = Date.now();
      const { expiresAt } = TokenUtils.generateToken();
      const after = Date.now();
      const expected = 24 * 60 * 60 * 1000;
      const diff = expiresAt.getTime() - before;
      expect(diff).toBeGreaterThanOrEqual(expected - 1000);
      expect(diff).toBeLessThanOrEqual(expected + (after - before) + 1000);
    });

    it("generates unique tokens on each call", () => {
      const a = TokenUtils.generateToken();
      const b = TokenUtils.generateToken();
      expect(a.rawToken).not.toBe(b.rawToken);
      expect(a.tokenHash).not.toBe(b.tokenHash);
    });
  });

  describe("hashToken", () => {
    it("is deterministic — same input produces same output", () => {
      const raw = "abc123";
      expect(TokenUtils.hashToken(raw)).toBe(TokenUtils.hashToken(raw));
    });

    it("produces a 64-char hex string", () => {
      expect(TokenUtils.hashToken("test")).toMatch(/^[0-9a-f]{64}$/);
    });

    it("produces different hashes for different inputs", () => {
      expect(TokenUtils.hashToken("foo")).not.toBe(TokenUtils.hashToken("bar"));
    });

    it("matches the tokenHash stored in generateToken output", () => {
      const { rawToken, tokenHash } = TokenUtils.generateToken();
      expect(TokenUtils.hashToken(rawToken)).toBe(tokenHash);
    });
  });

  describe("isExpired", () => {
    it("returns true for a date in the past", () => {
      const past = new Date(Date.now() - 1000);
      expect(TokenUtils.isExpired(past)).toBe(true);
    });

    it("returns false for a date in the future", () => {
      const future = new Date(Date.now() + 60_000);
      expect(TokenUtils.isExpired(future)).toBe(false);
    });
  });
});
