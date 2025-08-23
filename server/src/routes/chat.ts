import express, { Request, Response } from "express";
import { body, param, validationResult, query } from "express-validator";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

import User from "../models/User";
import { authenticateJWT } from "../middleware/auth";
import Chat from "../models/Chat";
import Message from "../models/Message";
import { IUser } from "../types";

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Get user's chats
router.get("/", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    console.log("Fetching chats for user:", user._id.toString());
    const userId = user._id.toString();
    const page = Number.parseInt(req.query.page as string) || 1;
    const limit = Number.parseInt(req.query.limit as string) || 20;

    const chats = await Chat.find({ participants: userId })
      .populate("participants", "name profileImage isAnonymous")
      .populate("lastMessage")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "name profileImage",
        },
      })
      .sort({ lastMessageAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    res.json({ chats, page, hasMore: chats.length === limit });
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ error: "Failed to fetch chats" });
  }
});

// Create or get private chat
router.post(
  "/private",
  authenticateJWT,
  [
    body("participantId")
      .notEmpty()
      .withMessage("Participant ID is required")
      .isMongoId()
      .withMessage("Invalid participant ID format"),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("Validation errors:", errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const user = req.user as IUser;
      const userId = user._id.toString();
      const { participantId } = req.body;

      console.log("Creating chat between:", userId, "and", participantId);

      // Validate that participantId is different from current user
      if (userId === participantId) {
        return res
          .status(400)
          .json({ error: "Cannot create chat with yourself" });
      }

      // Check if users are friends
      const dbUser = await User.findById(userId);
      if (!dbUser?.friends.includes(participantId)) {
        return res.status(403).json({ error: "Can only chat with friends" });
      }

      // Check if chat already exists
      let chat = await Chat.findOne({
        chatType: "private",
        participants: { $all: [userId, participantId], $size: 2 },
      }).populate("participants", "name profileImage isAnonymous");

      if (!chat) {
        // Create new chat
        chat = new Chat({
          participants: [userId, participantId],
          chatType: "private",
          createdBy: userId,
        });
        await chat.save();
        await chat.populate("participants", "name profileImage isAnonymous");
        console.log("Created new chat:", chat._id);
      } else {
        console.log("Found existing chat:", chat._id);
      }

      res.json({ chat });
    } catch (error) {
      console.error("Error creating/getting private chat:", error);
      res.status(500).json({ error: "Failed to create chat" });
    }
  }
);

// Get chat messages
router.get(
  "/:chatId/messages",
  authenticateJWT,
  [param("chatId").isMongoId().withMessage("Invalid chat ID")],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = req.user as IUser;
      const userId = user._id.toString();
      const { chatId } = req.params;
      const page = Number.parseInt(req.query.page as string) || 1;
      const limit = Number.parseInt(req.query.limit as string) || 50;

      console.log("Fetching messages for chat:", chatId, "user:", userId);

      // Verify user is participant
      const chat = await Chat.findOne({
        _id: chatId,
        participants: userId,
      });

      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }

      const messages = await Message.find({
        chatId,
        deletedAt: { $exists: false },
      })
        .populate("sender", "name profileImage")
        .populate("replyTo", "content sender messageType")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit);

      res.json({
        messages: messages.reverse(),
        page,
        hasMore: messages.length === limit,
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  }
);

// Upload media for chat
router.post(
  "/:chatId/upload",
  authenticateJWT,
  upload.single("file"),
  [param("chatId").isMongoId().withMessage("Invalid chat ID")],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const user = req.user as IUser;
      const userId = user._id.toString();
      const { chatId } = req.params;

      // Verify user is participant
      const chat = await Chat.findOne({
        _id: chatId,
        participants: userId,
      });

      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }

      // Determine resource type based on file type
      let resourceType = "auto";
      if (req.file.mimetype.startsWith("video/")) {
        resourceType = "video";
      } else if (req.file.mimetype.startsWith("image/")) {
        resourceType = "image";
      }

      // Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: resourceType as any,
            folder: "chat-media",
            public_id: `${chatId}_${Date.now()}`,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file!.buffer);
      });

      const result = uploadResult as any;

      res.json({
        mediaUrl: result.secure_url,
        mediaMetadata: {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          duration: result.duration || undefined,
        },
      });
    } catch (error) {
      console.error("Error uploading media:", error);
      res.status(500).json({ error: "Failed to upload media" });
    }
  }
);

// Delete message
router.delete(
  "/messages/:messageId",
  authenticateJWT,
  [param("messageId").isMongoId().withMessage("Invalid message ID")],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = req.user as IUser;
      const userId = user._id.toString();
      const { messageId } = req.params;

      const message = await Message.findOne({
        _id: messageId,
        sender: userId,
      });

      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }

      message.deletedAt = new Date();
      message.content = "This message was deleted";
      await message.save();

      res.json({ message: "Message deleted successfully" });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ error: "Failed to delete message" });
    }
  }
);

// Edit message
router.put(
  "/messages/:messageId",
  authenticateJWT,
  [
    param("messageId").isMongoId().withMessage("Invalid message ID"),
    body("content")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Content is required"),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = req.user as IUser;
      const userId = user._id.toString();
      const { messageId } = req.params;
      const { content } = req.body;

      const message = await Message.findOne({
        _id: messageId,
        sender: userId,
        messageType: "text",
      });

      if (!message) {
        return res
          .status(404)
          .json({ error: "Message not found or cannot be edited" });
      }

      message.content = content;
      message.editedAt = new Date();
      await message.save();

      res.json({ message });
    } catch (error) {
      console.error("Error editing message:", error);
      res.status(500).json({ error: "Failed to edit message" });
    }
  }
);

// Search messages
router.get(
  "/search",
  authenticateJWT,
  [
    query("q")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Search query is required"),
    query("chatId").optional().isMongoId().withMessage("Invalid chat ID"),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = req.user as IUser;
      const userId = user._id.toString();
      const { q: searchQuery, chatId, page = 1, limit = 20 } = req.query;

      // Build search criteria
      const searchCriteria: any = {
        content: { $regex: searchQuery, $options: "i" },
        deletedAt: { $exists: false },
      };

      // If chatId provided, search within specific chat
      if (chatId) {
        // Verify user is participant
        const chat = await Chat.findOne({
          _id: chatId,
          participants: userId,
        });

        if (!chat) {
          return res.status(404).json({ error: "Chat not found" });
        }

        searchCriteria.chatId = chatId;
      } else {
        // Search across all user's chats
        const userChats = await Chat.find({ participants: userId }).select(
          "_id"
        );
        const chatIds = userChats.map((chat) => chat._id);
        searchCriteria.chatId = { $in: chatIds };
      }

      const messages = await Message.find(searchCriteria)
        .populate("sender", "name profileImage")
        .populate("chatId", "participants")
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

      const totalResults = await Message.countDocuments(searchCriteria);

      res.json({
        messages,
        totalResults,
        page: Number(page),
        hasMore: messages.length === Number(limit),
      });
    } catch (error) {
      console.error("Error searching messages:", error);
      res.status(500).json({ error: "Failed to search messages" });
    }
  }
);

// Block user
router.post(
  "/block-user",
  authenticateJWT,
  [body("userId").isMongoId().withMessage("Invalid user ID")],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = req.user as IUser;
      const currentUserId = user._id.toString();
      const { userId } = req.body;

      if (currentUserId === userId) {
        return res.status(400).json({ error: "Cannot block yourself" });
      }

      // Add to blocked users list
      await User.findByIdAndUpdate(currentUserId, {
        $addToSet: { blockedUsers: userId },
      });

      // Remove from friends if they are friends
      await User.findByIdAndUpdate(currentUserId, {
        $pull: { friends: userId },
      });

      await User.findByIdAndUpdate(userId, {
        $pull: { friends: currentUserId },
      });

      res.json({ message: "User blocked successfully" });
    } catch (error) {
      console.error("Error blocking user:", error);
      res.status(500).json({ error: "Failed to block user" });
    }
  }
);

// Unblock user
router.post(
  "/unblock-user",
  authenticateJWT,
  [body("userId").isMongoId().withMessage("Invalid user ID")],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = req.user as IUser;
      const currentUserId = user._id.toString();
      const { userId } = req.body;

      await User.findByIdAndUpdate(currentUserId, {
        $pull: { blockedUsers: userId },
      });

      res.json({ message: "User unblocked successfully" });
    } catch (error) {
      console.error("Error unblocking user:", error);
      res.status(500).json({ error: "Failed to unblock user" });
    }
  }
);

// Report message
router.post(
  "/report-message",
  authenticateJWT,
  [
    body("messageId").isMongoId().withMessage("Invalid message ID"),
    body("reason")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Report reason is required"),
    body("description").optional().trim(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = req.user as IUser;
      const reporterId = user._id.toString();
      const { messageId, reason, description } = req.body;

      // Verify message exists and user has access
      const message = await Message.findById(messageId).populate("chatId");
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }

      const chat = message.chatId as any;
      if (!chat.participants.includes(reporterId)) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Create report (you would have a Report model)
      // For now, just log it
      console.log(`Message reported by ${reporterId}:`, {
        messageId,
        reason,
        description,
        reportedAt: new Date(),
      });

      res.json({ message: "Message reported successfully" });
    } catch (error) {
      console.error("Error reporting message:", error);
      res.status(500).json({ error: "Failed to report message" });
    }
  }
);

export default router;
