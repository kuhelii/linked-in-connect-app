import express from "express";
import multer from "multer";
import { body, param, validationResult } from "express-validator";
import User from "../models/User";
import { uploadToCloudinary } from "../config/cloudinary";
import { authenticateJWT } from "../middleware/auth";

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Get current user profile
router.get("/", authenticateJWT, async (req: any, res: any) => {
  try {
    const user = await User.findById(req.user!._id)
      .select("-password -refreshToken")
      .populate("friends", "name profileImage headline");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        headline: user.headline,
        location: user.location,
        coords: user.coords,
        friends: user.friends,
        friendsCount: user.friends.length,
        isAnonymous: user.isAnonymous,
        provider: user.provider,
        linkedinUrl: user.linkedinUrl,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to get profile" });
  }
});

// Get user profile by ID
router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid user ID")],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await User.findById(req.params.id)
        .select("-password -refreshToken -email")
        .populate("friends", "name profileImage headline");

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // If user is anonymous, hide personal information
      const profileData = user.isAnonymous
        ? {
            id: user._id,
            name: "Anonymous User",
            profileImage: "",
            headline: "",
            location: "",
            friendsCount: user.friends.length,
            isAnonymous: true,
            createdAt: user.createdAt,
          }
        : {
            id: user._id,
            name: user.name,
            profileImage: user.profileImage,
            headline: user.headline,
            location: user.location,
            friends: user.friends,
            friendsCount: user.friends.length,
            isAnonymous: user.isAnonymous,
            linkedinUrl: user.linkedinUrl,
            createdAt: user.createdAt,
          };

      res.json({
        success: true,
        data: profileData,
      });
    } catch (error) {
      console.error("Get user profile error:", error);
      res.status(500).json({ error: "Failed to get user profile" });
    }
  }
);

// Update current user profile
router.put(
  "/",
  authenticateJWT,
  upload.single("profileImage"),
  [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters"),
    body("headline")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Headline must be less than 200 characters"),
    body("location")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Location must be less than 100 characters"),
    body("isAnonymous")
      .optional()
      .isBoolean()
      .withMessage("isAnonymous must be a boolean"),
    body("coords")
      .optional()
      .isObject()
      .withMessage("Coordinates must be an object"),
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await User.findById((req.user as any)!._id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { name, headline, location, isAnonymous, coords } = req.body;

      // Update fields if provided
      if (name) user.name = name;
      if (headline !== undefined) user.headline = headline;
      if (location !== undefined) user.location = location;
      if (isAnonymous !== undefined) user.isAnonymous = isAnonymous;

      // Handle coordinates update
      if (coords && coords.lat && coords.lng) {
        user.coords = {
          type: "Point",
          coordinates: [
            Number.parseFloat(coords.lng),
            Number.parseFloat(coords.lat),
          ],
        };
      }

      // Handle profile image upload
      if (req.file) {
        try {
          const imageUrl = await uploadToCloudinary(req.file);
          user.profileImage = imageUrl;
        } catch (uploadError) {
          console.error("Image upload error:", uploadError);
          return res
            .status(400)
            .json({ error: "Failed to upload profile image" });
        }
      }

      await user.save();

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          profileImage: user.profileImage,
          headline: user.headline,
          location: user.location,
          coords: user.coords,
          isAnonymous: user.isAnonymous,
          friendsCount: user.friends.length,
        },
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  }
);

export default router;
