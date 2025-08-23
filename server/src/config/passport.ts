import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LinkedInStrategy } from "passport-linkedin-oauth2";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import User from "../models/User";
import dotenv from "dotenv";

dotenv.config();

// Local Strategy
passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email: string, password: string, done) => {
      try {
        const user = await User.findOne({ email, provider: "local" });
        if (!user) {
          return done(null, false, { message: "Invalid credentials" });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          return done(null, false, { message: "Invalid credentials" });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({
            $or: [
              { providerId: profile.id, provider: "google" },
              { email: profile.emails?.[0]?.value },
            ],
          });

          if (user) {
            // Update existing user
            user.providerId = profile.id;
            user.provider = "google";
            user.refreshToken = refreshToken || "";
            await user.save();
            return done(null, user);
          }

          // Create new user
          user = new User({
            name: profile.displayName,
            email: profile.emails?.[0]?.value,
            profileImage: profile.photos?.[0]?.value || "",
            provider: "google",
            providerId: profile.id,
            refreshToken: refreshToken || "",
          });

          await user.save();
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
} else {
  console.warn(
    "Google OAuth credentials not configured. Google authentication will be disabled."
  );
}

// LinkedIn Strategy
if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
  passport.use(
    new LinkedInStrategy(
      {
        clientID: process.env.LINKEDIN_CLIENT_ID,
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
        callbackURL: "/api/auth/linkedin/callback",
        scope: ["r_emailaddress", "r_liteprofile"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({
            $or: [
              { providerId: profile.id, provider: "linkedin" },
              { email: profile.emails?.[0]?.value },
            ],
          });

          if (user) {
            // Update existing user
            user.providerId = profile.id;
            user.provider = "linkedin";
            user.linkedinUrl = `https://linkedin.com/in/${
              profile.username || ""
            }`;
            user.refreshToken = refreshToken || "";
            await user.save();
            return done(null, user);
          }

          // Create new user
          user = new User({
            name: profile.displayName,
            email: profile.emails?.[0]?.value,
            profileImage: profile.photos?.[0]?.value || "",
            headline: profile._json?.headline || "",
            provider: "linkedin",
            providerId: profile.id,
            linkedinUrl: `https://linkedin.com/in/${profile.username || ""}`,
            refreshToken: refreshToken || "",
          });

          await user.save();
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
} else {
  console.warn(
    "LinkedIn OAuth credentials not configured. LinkedIn authentication will be disabled."
  );
}

// JWT Strategy
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET as string,
    },
    async (payload, done) => {
      try {
        const user = await User.findById(payload.userId).select(
          "-password -refreshToken"
        );
        if (user) {
          return done(null, user);
        }
        return done(null, false);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Serialize/Deserialize user
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id).select("-password -refreshToken");
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;
