import express from "express";
import { query, validationResult } from "express-validator";
import { linkedinSearchService } from "../services/linkedinSearch";
import User from "../models/User";
import { optionalAuth } from "../middleware/auth";
import type { NearbyUser } from "../types";
import {
  calculateDistance,
  filterUsersByDistance,
  calculateBearing,
  getRelativeTimeString,
  extractCoordinates,
} from "../utils/distance";
import { formatDistanceToNow } from "date-fns";

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
          location: `${latitude}, ${longitude}`,
          lastLocationUpdate: new Date(),
        });
        console.log("User location updated successfully");
      } catch (updateError) {
        console.error("Failed to update user location:", updateError);
      }
    }

    console.log("Fetching all users from database");

    // Get all users (excluding current user if authenticated)
    const allUsers = await User.find({
      ...(req.user ? { _id: { $ne: req.user._id } } : {}), // Exclude current user if authenticated
    })
      .select({
        _id: 1,
        name: 1,
        headline: 1,
        profileImage: 1,
        location: 1,
        isAnonymous: 1,
        coords: 1,
        lastLocationUpdate: 1,
      })
      .lean();

    console.log(`Found ${allUsers.length} users with valid coordinates`);
    console.log("Calculating distances and filtering by radius", allUsers);

    // Calculate distances using Haversine formula and filter by radius
    const nearbyUsersWithDistance = filterUsersByDistance(
      allUsers,
      latitude,
      longitude,
      radiusKm
    );

    console.log(
      `Found ${nearbyUsersWithDistance.length} users within ${radiusKm}km radius`
    );

    console.log("Nearby users with distance:", nearbyUsersWithDistance);

    // Limit results and transform for response
    const limitedUsers = nearbyUsersWithDistance.slice(0, 50);

    // Transform results to hide information for anonymous users
    const transformedUsers: NearbyUser[] = limitedUsers.map((user) => {
      // Calculate bearing from current user to this user
      let bearing: number | undefined;
      let lastVisit: string | undefined;

      // Extract coordinates for bearing calculation (using existing function name)
      const coordinates = extractCoordinates(user);
      if (coordinates) {
        const [userLon, userLat] = coordinates;
        bearing = calculateBearing(latitude, longitude, userLat, userLon);
      }

      // Get last visit information
      if (user.lastLocationUpdate) {
        lastVisit = getRelativeTimeString(new Date(user.lastLocationUpdate));
      }

      return {
        _id: user._id.toString(),
        name: user.isAnonymous ? "Anonymous User" : user.name,
        headline: user.isAnonymous ? "" : user.headline || "",
        profileImage: user.isAnonymous ? "" : user.profileImage || "",
        location: user.isAnonymous ? "" : user.location || "",
        distance: user.distance,
        bearing,
        lastVisit,
        isAnonymous: user.isAnonymous,
      };
    });

    console.log("Transformed users data:", transformedUsers);

    const responseData = {
      success: true,
      data: {
        users: transformedUsers,
        count: transformedUsers.length,
        searchRadius: radiusKm,
        searchCenter: { lat: latitude, lng: longitude },
        calculationMethod: "haversine",
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

// Search users by various criteria
router.get("/users", optionalAuth, async (req: any, res: any) => {
  try {
    console.log("User search initiated");
    console.log("Request query:", req.query);
    console.log("Authenticated user:", req.user ? req.user._id : "None");

    const {
      q, // search query
      lat,
      lng,
      radius,
      page = "1",
      limit = "20",
    } = req.query as {
      q?: string;
      lat?: string;
      lng?: string;
      radius?: string;
      page?: string;
      limit?: string;
    };

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Build search criteria
    const searchCriteria: any = {
      ...(req.user ? { _id: { $ne: req.user._id } } : {}), // Exclude current user if authenticated
    };

    // Add text search if query provided
    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), "i");
      searchCriteria.$or = [
        { name: searchRegex },
        { headline: searchRegex },
        { location: searchRegex },
      ];
    }

    console.log("Search criteria:", searchCriteria);

    // Get users based on search criteria
    const users = await User.find(searchCriteria)
      .select({
        _id: 1,
        name: 1,
        headline: 1,
        profileImage: 1,
        location: 1,
        isAnonymous: 1,
        coords: 1,
        lastLocationUpdate: 1,
      })
      .lean();

    console.log(`Found ${users.length} users matching search criteria`);

    let filteredUsers = users;

    // Apply distance filtering if coordinates provided
    if (lat && lng && radius) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const radiusKm = parseFloat(radius);

      if (!isNaN(latitude) && !isNaN(longitude) && !isNaN(radiusKm)) {
        console.log(
          `Applying distance filter: ${radiusKm}km from ${latitude}, ${longitude}`
        );

        filteredUsers = filterUsersByDistance(
          users, // No need to filter here since extractCoordinates handles both formats
          latitude,
          longitude,
          radiusKm
        );

        console.log(`${filteredUsers.length} users within radius`);
      }
    }

    // Apply pagination
    const totalCount = filteredUsers.length;
    const paginatedUsers = filteredUsers.slice(skip, skip + limitNum);

    // Transform results
    const transformedUsers: NearbyUser[] = paginatedUsers.map((user) => {
      const lastVisit = user.lastLocationUpdate
        ? formatDistanceToNow(new Date(user.lastLocationUpdate), {
            addSuffix: true,
          })
        : null;
      return {
        _id: user._id.toString(),
        name: user.isAnonymous ? "Anonymous User" : user.name,
        headline: user.isAnonymous ? "" : user.headline || "",
        profileImage: user.isAnonymous ? "" : user.profileImage || "",
        location: user.isAnonymous ? "" : user.location || "",
        distance:
          "distance" in user && typeof user.distance === "number"
            ? user.distance
            : 0,
        isAnonymous: user.isAnonymous,
        lastVisit: lastVisit || undefined,
      };
    });

    const responseData = {
      success: true,
      data: {
        users: transformedUsers,
        count: transformedUsers.length,
        totalCount,
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        hasNextPage: skip + limitNum < totalCount,
        hasPrevPage: pageNum > 1,
        searchQuery: q || "",
        ...(lat && lng && radius
          ? {
              searchRadius: parseFloat(radius),
              searchCenter: { lat: parseFloat(lat), lng: parseFloat(lng) },
              calculationMethod: "haversine",
            }
          : {}),
      },
    };

    console.log(`Sending response with ${transformedUsers.length} users`);
    res.json(responseData);
  } catch (error) {
    console.error("User search error:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    res.status(500).json({ error: "Failed to search users" });
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
