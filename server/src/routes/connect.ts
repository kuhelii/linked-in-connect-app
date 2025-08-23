import express from "express";
import { query, validationResult } from "express-validator";
import { linkedinSearchService } from "../services/linkedinSearch";
import User from "../models/User";
import { optionalAuth } from "../middleware/auth";
import type { NearbyUser } from "../types";

const router = express.Router();

// Search LinkedIn profiles by location
router.get(
  "/location",
  [
    query("location").notEmpty().withMessage("Location is required"),
    query("role").optional().isString(),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        location,
        role = "",
        page = 1,
      } = req.query as {
        location: string;
        role?: string;
        page?: number;
      };

      const result = await linkedinSearchService.searchLinkedInProfiles(
        location,
        role,
        Number.parseInt(page.toString())
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Location search error:", error);
      res.status(500).json({
        error: "Failed to search LinkedIn profiles",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Find nearby users
router.get("/nearby", optionalAuth, async (req: any, res: any) => {
  try {
    const {
      lat,
      lng,
      radius = "10",
    } = req.query as {
      lat?: string;
      lng?: string;
      radius?: string;
    };

    if (!lat || !lng) {
      return res
        .status(400)
        .json({ error: "Latitude and longitude are required" });
    }

    const latitude = Number.parseFloat(lat);
    const longitude = Number.parseFloat(lng);
    const radiusKm = Number.parseFloat(radius);

    if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusKm)) {
      return res.status(400).json({ error: "Invalid coordinates or radius" });
    }

    // MongoDB geospatial query to find nearby users
    const nearbyUsers = await User.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [longitude, latitude], // MongoDB uses [lng, lat]
          },
          distanceField: "distance",
          maxDistance: radiusKm * 1000, // Convert km to meters
          spherical: true,
          query: {
            "coords.coordinates": { $ne: [0, 0] }, // Exclude users without coordinates
            ...(req.user ? { _id: { $ne: (req.user as any)._id } } : {}), // Exclude current user if authenticated
          },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          headline: 1,
          profileImage: 1,
          location: 1,
          isAnonymous: 1,
          distance: { $round: ["$distance", 0] }, // Round distance to nearest meter
        },
      },
      {
        $limit: 50, // Limit results
      },
    ]);

    // Transform results to hide information for anonymous users
    const transformedUsers: NearbyUser[] = nearbyUsers.map((user) => ({
      _id: user._id.toString(),
      name: user.isAnonymous ? "Anonymous User" : user.name,
      headline: user.isAnonymous ? "" : user.headline || "",
      profileImage: user.isAnonymous ? "" : user.profileImage || "",
      location: user.isAnonymous ? "" : user.location || "",
      distance: user.distance,
      isAnonymous: user.isAnonymous,
    }));

    res.json({
      success: true,
      data: {
        users: transformedUsers,
        count: transformedUsers.length,
        searchRadius: radiusKm,
        searchCenter: { lat: latitude, lng: longitude },
      },
    });
  } catch (error) {
    console.error("Nearby users search error:", error);
    res.status(500).json({ error: "Failed to find nearby users" });
  }
});

// Search LinkedIn profiles by keywords
router.get(
  "/search",
  [
    query("keywords").notEmpty().withMessage("Keywords are required"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { keywords, page = 1 } = req.query as {
        keywords: string;
        page?: number;
      };

      // Split keywords by comma or space
      const keywordArray = keywords
        .split(/[,\s]+/)
        .filter((k) => k.trim().length > 0);

      const result =
        await linkedinSearchService.searchLinkedInProfilesByKeywords(
          keywordArray,
          Number.parseInt(page.toString())
        );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Keyword search error:", error);
      res.status(500).json({
        error: "Failed to search LinkedIn profiles",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default router;
