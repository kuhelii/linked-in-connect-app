import express from "express";
import { param, validationResult } from "express-validator";
import User from "../models/User";
import FriendRequest from "../models/FriendRequest";
import { authenticateJWT } from "../middleware/auth";

const router = express.Router();

// Send friend request
router.post(
  "/request/:id",
  [param("id").isMongoId().withMessage("Invalid user ID")],
  authenticateJWT,
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const fromUserId = (req.user as any)!._id.toString();
      const toUserId = req.params.id;

      // Check if trying to send request to self
      if (fromUserId === toUserId) {
        return res
          .status(400)
          .json({ error: "Cannot send friend request to yourself" });
      }

      // Check if target user exists
      const toUser = await User.findById(toUserId);
      if (!toUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if users are already friends
      const fromUser = await User.findById(fromUserId);
      if (fromUser!.friends.includes(toUserId)) {
        return res.status(400).json({ error: "Users are already friends" });
      }

      // Check if friend request already exists
      const existingRequest = await FriendRequest.findOne({
        $or: [
          { from: fromUserId, to: toUserId },
          { from: toUserId, to: fromUserId },
        ],
      });

      if (existingRequest) {
        if (existingRequest.status === "pending") {
          return res
            .status(400)
            .json({ error: "Friend request already exists" });
        }
        if (existingRequest.status === "accepted") {
          return res.status(400).json({ error: "Users are already friends" });
        }
      }

      // Create new friend request
      const friendRequest = new FriendRequest({
        from: fromUserId,
        to: toUserId,
        status: "pending",
      });

      await friendRequest.save();

      // Update user's sent requests
      await User.findByIdAndUpdate(fromUserId, {
        $addToSet: { "friendRequests.sent": toUserId },
      });

      // Update target user's received requests
      await User.findByIdAndUpdate(toUserId, {
        $addToSet: { "friendRequests.received": fromUserId },
      });

      res.status(201).json({
        success: true,
        message: "Friend request sent successfully",
        data: {
          requestId: friendRequest._id,
          to: toUser.name,
          status: "pending",
        },
      });
    } catch (error) {
      console.error("Send friend request error:", error);
      res.status(500).json({ error: "Failed to send friend request" });
    }
  }
);

// Accept friend request
router.post(
  "/accept/:id",
  [param("id").isMongoId().withMessage("Invalid request ID")],
  authenticateJWT,
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const requestId = req.params.id;
      const userId = (req.user as any)!._id.toString();

      // Find the friend request
      const friendRequest = await FriendRequest.findById(requestId).populate(
        "from",
        "name profileImage"
      );
      if (!friendRequest) {
        return res.status(404).json({ error: "Friend request not found" });
      }

      // Check if current user is the recipient
      if (friendRequest.to.toString() !== userId) {
        return res
          .status(403)
          .json({ error: "Not authorized to accept this request" });
      }

      // Check if request is still pending
      if (friendRequest.status !== "pending") {
        return res
          .status(400)
          .json({ error: "Friend request is no longer pending" });
      }

      // Update friend request status
      friendRequest.status = "accepted";
      await friendRequest.save();

      const fromUserId =
        typeof friendRequest.from === "object" &&
        friendRequest.from !== null &&
        "_id" in friendRequest.from
          ? (friendRequest.from as any)._id.toString()
          : friendRequest.from.toString();

      // Add each user to the other's friends list
      await User.findByIdAndUpdate(userId, {
        $addToSet: { friends: fromUserId },
        $pull: { "friendRequests.received": fromUserId },
      });

      await User.findByIdAndUpdate(fromUserId, {
        $addToSet: { friends: userId },
        $pull: { "friendRequests.sent": userId },
      });

      res.json({
        success: true,
        message: "Friend request accepted",
        data: {
          friend: {
            id:
              typeof friendRequest.from === "object" &&
              friendRequest.from !== null &&
              "_id" in friendRequest.from
                ? (friendRequest.from as any)._id
                : friendRequest.from,
            name: (friendRequest.from as any).name,
            profileImage: (friendRequest.from as any).profileImage,
          },
        },
      });
    } catch (error) {
      console.error("Accept friend request error:", error);
      res.status(500).json({ error: "Failed to accept friend request" });
    }
  }
);

// Reject friend request
router.post(
  "/reject/:id",
  [param("id").isMongoId().withMessage("Invalid request ID")],
  authenticateJWT,
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const requestId = req.params.id;
      const userId = (req.user as any)!._id.toString();

      // Find the friend request
      const friendRequest = await FriendRequest.findById(requestId);
      if (!friendRequest) {
        return res.status(404).json({ error: "Friend request not found" });
      }

      // Check if current user is the recipient
      if (friendRequest.to.toString() !== userId) {
        return res
          .status(403)
          .json({ error: "Not authorized to reject this request" });
      }

      // Check if request is still pending
      if (friendRequest.status !== "pending") {
        return res
          .status(400)
          .json({ error: "Friend request is no longer pending" });
      }

      // Update friend request status
      friendRequest.status = "rejected";
      await friendRequest.save();

      const fromUserId = friendRequest.from.toString();

      // Remove from both users' request lists
      await User.findByIdAndUpdate(userId, {
        $pull: { "friendRequests.received": fromUserId },
      });

      await User.findByIdAndUpdate(fromUserId, {
        $pull: { "friendRequests.sent": userId },
      });

      res.json({
        success: true,
        message: "Friend request rejected",
      });
    } catch (error) {
      console.error("Reject friend request error:", error);
      res.status(500).json({ error: "Failed to reject friend request" });
    }
  }
);

// Get friends list
router.get("/", authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById((req.user as any)!._id).populate(
      "friends",
      "name profileImage headline location isAnonymous"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Filter out anonymous users' personal info
    const friends = user.friends.map((friend: any) => ({
      id: friend._id,
      name: friend.isAnonymous ? "Anonymous User" : friend.name,
      profileImage: friend.isAnonymous ? "" : friend.profileImage || "",
      headline: friend.isAnonymous ? "" : friend.headline || "",
      location: friend.isAnonymous ? "" : friend.location || "",
      isAnonymous: friend.isAnonymous,
    }));

    res.json({
      success: true,
      data: {
        friends,
        count: friends.length,
      },
    });
  } catch (error) {
    console.error("Get friends error:", error);
    res.status(500).json({ error: "Failed to get friends list" });
  }
});

// Get pending friend requests (received)
router.get(
  "/requests/received",
  authenticateJWT,
  async (req: any, res: any) => {
    try {
      const requests = await FriendRequest.find({
        to: (req.user as any)!._id,
        status: "pending",
      })
        .populate("from", "name profileImage headline")
        .sort({ createdAt: -1 });

      const formattedRequests = requests.map((request) => ({
        id: request._id,
        from: {
          id: (request.from as any)._id,
          name: (request.from as any).name,
          profileImage: (request.from as any).profileImage || "",
          headline: (request.from as any).headline || "",
        },
        status: request.status,
        createdAt: request.createdAt,
      }));

      res.json({
        success: true,
        data: {
          requests: formattedRequests,
          count: formattedRequests.length,
        },
      });
    } catch (error) {
      console.error("Get received requests error:", error);
      res.status(500).json({ error: "Failed to get friend requests" });
    }
  }
);

// Get sent friend requests
router.get("/requests/sent", authenticateJWT, async (req: any, res: any) => {
  try {
    const requests = await FriendRequest.find({
      from: (req.user as any)!._id,
      status: "pending",
    })
      .populate("to", "name profileImage headline")
      .sort({ createdAt: -1 });

    const formattedRequests = requests.map((request) => ({
      id: request._id,
      to: {
        id: (request.to as any)._id,
        name: (request.to as any).name,
        profileImage: (request.to as any).profileImage || "",
        headline: (request.to as any).headline || "",
      },
      status: request.status,
      createdAt: request.createdAt,
    }));

    res.json({
      success: true,
      data: {
        requests: formattedRequests,
        count: formattedRequests.length,
      },
    });
  } catch (error) {
    console.error("Get sent requests error:", error);
    res.status(500).json({ error: "Failed to get sent requests" });
  }
});

// Remove friend
router.delete(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid user ID")],
  authenticateJWT,
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = (req.user as any)!._id.toString();
      const friendId = req.params.id;

      // Check if they are actually friends
      const user = await User.findById(userId);
      if (!user || !user.friends.includes(friendId)) {
        return res.status(400).json({ error: "Users are not friends" });
      }

      // Remove from both users' friends lists
      await User.findByIdAndUpdate(userId, {
        $pull: { friends: friendId },
      });

      await User.findByIdAndUpdate(friendId, {
        $pull: { friends: userId },
      });

      // Update the friend request status to rejected (if it exists)
      await FriendRequest.findOneAndUpdate(
        {
          $or: [
            { from: userId, to: friendId },
            { from: friendId, to: userId },
          ],
        },
        { status: "rejected" }
      );

      res.json({
        success: true,
        message: "Friend removed successfully",
      });
    } catch (error) {
      console.error("Remove friend error:", error);
      res.status(500).json({ error: "Failed to remove friend" });
    }
  }
);

// Cancel sent friend request
router.delete(
  "/request/:id",
  [param("id").isMongoId().withMessage("Invalid request ID")],
  authenticateJWT,
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const requestId = req.params.id;
      const userId = req.user!._id.toString();

      // Find the friend request
      const friendRequest = await FriendRequest.findById(requestId);
      if (!friendRequest) {
        return res.status(404).json({ error: "Friend request not found" });
      }

      // Check if current user sent the request
      if (friendRequest.from.toString() !== userId) {
        return res
          .status(403)
          .json({ error: "Not authorized to cancel this request" });
      }

      // Check if request is still pending
      if (friendRequest.status !== "pending") {
        return res
          .status(400)
          .json({ error: "Cannot cancel non-pending request" });
      }

      // Delete the friend request
      await FriendRequest.findByIdAndDelete(requestId);

      const toUserId = friendRequest.to.toString();

      // Remove from both users' request lists
      await User.findByIdAndUpdate(userId, {
        $pull: { "friendRequests.sent": toUserId },
      });

      await User.findByIdAndUpdate(toUserId, {
        $pull: { "friendRequests.received": userId },
      });

      res.json({
        success: true,
        message: "Friend request cancelled",
      });
    } catch (error) {
      console.error("Cancel friend request error:", error);
      res.status(500).json({ error: "Failed to cancel friend request" });
    }
  }
);

export default router;
