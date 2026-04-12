import { Router, Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq, or } from "drizzle-orm";
import { JWT_SECRET, generateToken, requireAuth, AuthRequest } from "../middleware/auth.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../services/email.js";

const router = Router();

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";
const BACKEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

// ─── Google OAuth setup ────────────────────────────────────────────────────────

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${BACKEND_URL}/api/auth/google/callback`,
        scope: ["profile", "email"],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value ?? "";
          const name = profile.displayName ?? "";
          const avatar_url = profile.photos?.[0]?.value ?? null;

          // Check if user exists by google_id or email
          const existing = db
            .select()
            .from(users)
            .where(or(eq(users.google_id, googleId), eq(users.email, email)))
            .get();

          if (existing) {
            // Link Google to existing local account if needed
            if (!existing.google_id) {
              db.update(users)
                .set({ google_id: googleId, avatar_url, provider: "google", is_verified: true })
                .where(eq(users.id, existing.id))
                .run();
            }
            return done(null, { ...existing, google_id: googleId, avatar_url });
          }

          // New user via Google
          const [user] = db
            .insert(users)
            .values({ email, name, avatar_url, provider: "google", google_id: googleId, is_verified: true })
            .returning()
            .all();

          return done(null, user);
        } catch (err) {
          return done(err as Error);
        }
      }
    )
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// ─── Local auth ───────────────────────────────────────────────────────────────

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  try {
    const existing = db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).get();
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const verification_token = generateSecureToken();
    const verification_token_expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    db.insert(users)
      .values({
        email: email.toLowerCase().trim(),
        password_hash,
        name: name.trim(),
        provider: "local",
        is_verified: false,
        verification_token,
        verification_token_expires_at,
      })
      .run();

    await sendVerificationEmail(email.toLowerCase().trim(), verification_token).catch((err) => {
      console.error("[email] verification send failed:", err?.message ?? err);
    });

    res.status(201).json({ message: "Check your email to verify your account" });
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/auth/verify-email?token=xxx
router.post("/verify-email", async (req: Request, res: Response) => {
  const token = (req.query.token as string) || req.body.token;

  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  try {
    const user = db.select().from(users).where(eq(users.verification_token, token)).get();

    if (!user || !user.verification_token_expires_at) {
      return res.status(400).json({ error: "Invalid or expired verification link" });
    }
    if (new Date(user.verification_token_expires_at) < new Date()) {
      return res.status(400).json({ error: "Verification link has expired" });
    }

    db.update(users)
      .set({ is_verified: true, verification_token: null, verification_token_expires_at: null })
      .where(eq(users.id, user.id))
      .run();

    const jwt_token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url ?? undefined,
    });

    res.json({ token: jwt_token, user: { id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url } });
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).get();

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    if (user.provider === "google") {
      return res.status(400).json({ error: "This account uses Google to sign in" });
    }
    if (!user.is_verified) {
      return res.status(403).json({ error: "Please verify your email before signing in" });
    }
    if (!user.password_hash) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url ?? undefined,
    });

    res.json({ token, user: { id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url } });
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/auth/logout
router.post("/logout", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req: Request, res: Response) => {
  const { email } = req.body;
  const GENERIC_RESPONSE = { message: "If that email exists, you'll receive reset instructions" };

  if (!email?.trim()) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const user = db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).get();

    // Always return 200 to avoid revealing if email exists
    if (!user || user.provider === "google") {
      return res.json(GENERIC_RESPONSE);
    }

    const reset_token = generateSecureToken();
    const reset_token_expires_at = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    db.update(users)
      .set({ reset_token, reset_token_expires_at })
      .where(eq(users.id, user.id))
      .run();

    await sendPasswordResetEmail(user.email, reset_token).catch(() => {});

    res.json(GENERIC_RESPONSE);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: "Token and new password are required" });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  try {
    const user = db.select().from(users).where(eq(users.reset_token, token)).get();

    if (!user || !user.reset_token_expires_at) {
      return res.status(400).json({ error: "Invalid or expired reset link" });
    }
    if (new Date(user.reset_token_expires_at) < new Date()) {
      return res.status(400).json({ error: "Reset link has expired" });
    }

    if (user.password_hash && await bcrypt.compare(newPassword, user.password_hash)) {
      return res.status(400).json({ error: "New password must be different from your current password" });
    }

    const password_hash = await bcrypt.hash(newPassword, 12);

    db.update(users)
      .set({ password_hash, reset_token: null, reset_token_expires_at: null })
      .where(eq(users.id, user.id))
      .run();

    res.json({ message: "Password updated successfully" });
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/auth/resend-verification
router.post("/resend-verification", async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email?.trim()) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const user = db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).get();

    if (!user || user.is_verified) {
      return res.json({ message: "If that email exists and is unverified, a new link was sent" });
    }

    const verification_token = generateSecureToken();
    const verification_token_expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    db.update(users)
      .set({ verification_token, verification_token_expires_at })
      .where(eq(users.id, user.id))
      .run();

    await sendVerificationEmail(user.email, verification_token).catch(() => {});

    res.json({ message: "If that email exists and is unverified, a new link was sent" });
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, (req: Request, res: Response) => {
  const { userId, email, name, avatar_url } = (req as unknown as AuthRequest).user;
  const user = db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) return res.status(404).json({ error: "User not found" });

  res.json({ id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url, provider: user.provider, is_verified: user.is_verified });
});

// ─── Google OAuth routes ──────────────────────────────────────────────────────

router.get(
  "/google",
  (req: Request, res: Response, next) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(501).json({ error: "Google OAuth is not configured" });
    }
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

router.get(
  "/google/callback",
  (req: Request, res: Response, next) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_not_configured`);
    }
    next();
  },
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${FRONTEND_URL}/login?error=oauth_failed`,
  }),
  (req: Request, res: Response) => {
    const user = req.user as any;
    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
    });
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

export { passport };
export default router;
