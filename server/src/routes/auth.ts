import express from "express";
import passport from "passport";
import { body, validationResult } from "express-validator";
import User from "../models/User";
import { generateTokens, verifyRefreshToken } from "../utils/jwt";
import { authenticateJWT } from "../middleware/auth";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Local Registration
router.post(
  "/register",
  [
    body("name")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Create user
      const user = new User({
        name,
        email,
        password,
        provider: "local",
      });

      await user.save();

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user._id.toString());

      // Save refresh token
      user.refreshToken = refreshToken;
      await user.save();

      res.status(201).json({
        message: "User created successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          profileImage: user.profileImage,
          headline: user.headline,
          location: user.location,
          isAnonymous: user.isAnonymous,
        },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Local Login
router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").exists()],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      passport.authenticate(
        "local",
        { session: false },
        async (err: any, user: any, info: any) => {
          if (err) {
            return res.status(500).json({ error: "Server error" });
          }
          if (!user) {
            return res
              .status(401)
              .json({ error: info?.message || "Invalid credentials" });
          }

          // Generate tokens
          const { accessToken, refreshToken } = generateTokens(
            user._id.toString()
          );

          // Save refresh token
          user.refreshToken = refreshToken;
          await user.save();

          res.json({
            message: "Login successful",
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              profileImage: user.profileImage,
              headline: user.headline,
              location: user.location,
              isAnonymous: user.isAnonymous,
            },
            accessToken,
            refreshToken,
          });
        }
      )(req, res);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Google OAuth
router.get("/google", (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(400).json({ error: "Google OAuth not configured" });
  }
  passport.authenticate("google", { scope: ["profile", "email"] })(
    req,
    res,
    next
  );
});

router.get(
  "/google/callback",
  (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.redirect(
        `${process.env.CLIENT_URL}/login?error=oauth_not_configured`
      );
    }
    passport.authenticate("google", { session: false })(req, res, next);
  },
  async (req: express.Request, res: express.Response) => {
    try {
      const user = (req.user as any)!;
      const { accessToken, refreshToken } = generateTokens(user._id.toString());

      user.refreshToken = refreshToken;
      await user.save();

      // Redirect to frontend with tokens
      res.redirect(
        `${process.env.CLIENT_URL}/auth/callback?token=${accessToken}&refresh=${refreshToken}`
      );
    } catch (error) {
      res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
    }
  }
);

// LinkedIn OAuth
router.get("/linkedin", (req, res, next) => {
  if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
    return res.status(400).json({ error: "LinkedIn OAuth not configured" });
  }
  passport.authenticate("linkedin")(req, res, next);
});

router.get(
  "/linkedin/callback",
  (req, res, next) => {
    if (
      !process.env.LINKEDIN_CLIENT_ID ||
      !process.env.LINKEDIN_CLIENT_SECRET
    ) {
      return res.redirect(
        `${process.env.CLIENT_URL}/login?error=oauth_not_configured`
      );
    }
    passport.authenticate("linkedin", { session: false })(req, res, next);
  },
  async (req: express.Request, res: express.Response) => {
    try {
      const user = (req.user as any)!;
      const { accessToken, refreshToken } = generateTokens(user._id.toString());

      user.refreshToken = refreshToken;
      await user.save();

      // Redirect to frontend with tokens
      res.redirect(
        `${process.env.CLIENT_URL}/auth/callback?token=${accessToken}&refresh=${refreshToken}`
      );
    } catch (error) {
      res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
    }
  }
);

// Refresh Token
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token required" });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user._id.toString()
    );

    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Logout
router.post("/logout", authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById((req.user as any)?._id);
    if (user) {
      user.refreshToken = "";
      await user.save();
    }
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get current user
router.get("/me", authenticateJWT, (req, res) => {
  const user = req.user as any;
  res.json({
    user: {
      id: user?._id,
      name: user?.name,
      email: user?.email,
      profileImage: user?.profileImage,
      headline: user?.headline,
      location: user?.location,
      isAnonymous: user?.isAnonymous,
      friendsCount: user?.friends?.length,
    },
  });
});

export default router;
