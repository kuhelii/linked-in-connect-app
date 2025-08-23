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
    console.log("Nearby users search initiated");
    console.log("Request query:", req.query);
    console.log("Authenticated user:", req.user ? req.user._id : "None");

    const {
      lat,
      lng,
      radius = "10",
    } = req.query as {
      lat?: string;
      lng?: string;
      radius?: string;
    };

    console.log("Parsed query params:", { lat, lng, radius });

    if (!lat || !lng) {
      console.log("Missing coordinates - lat:", lat, "lng:", lng);
      return res
        .status(400)
        .json({ error: "Latitude and longitude are required" });
    }

    const latitude = Number.parseFloat(lat);
    const longitude = Number.parseFloat(lng);
    const radiusKm = Number.parseFloat(radius);

    console.log("Converted coordinates:", { latitude, longitude, radiusKm });

    if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusKm)) {
      console.log("Invalid coordinates or radius");
      return res.status(400).json({ error: "Invalid coordinates or radius" });
    }

    // Update current user's location if authenticated
    if (req.user) {
      console.log("Updating authenticated user's location");
      try {
        await User.findByIdAndUpdate(req.user._id, {
          coords: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          location: `${latitude}, ${longitude}`, // You might want to reverse geocode this
        });
        console.log("User location updated successfully");
      } catch (updateError) {
        console.error("Failed to update user location:", updateError);
      }
    }

    console.log("Starting MongoDB geospatial query");

    // Find nearby users using geospatial query
    console.log("Executing geospatial query with params:", {
      longitude,
      latitude,
      radiusKm,
      maxDistanceMeters: radiusKm * 1000,
    });

    const nearbyUsers = await User.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [longitude, latitude] },
          distanceField: "distance",
          maxDistance: radiusKm * 1000,
          spherical: true,
          query: { "coords.coordinates": { $ne: [0, 0] } },
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
          distance: { $round: ["$distance", 0] },
        },
      },
      { $limit: 50 },
    ]);

    console.log("MongoDB query completed. Found", nearbyUsers.length, "users");
    console.log("Raw nearby users data:", nearbyUsers);

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

    console.log("Transformed users data:", transformedUsers);

    const responseData = {
      success: true,
      data: {
        users: transformedUsers,
        count: transformedUsers.length,
        searchRadius: radiusKm,
        searchCenter: { lat: latitude, lng: longitude },
      },
    };

    console.log("Sending response:", responseData);

    res.json(responseData);
  } catch (error) {
    console.error("Nearby users search error:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
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
