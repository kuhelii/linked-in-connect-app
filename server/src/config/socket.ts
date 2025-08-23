import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import type { Server as HTTPServer } from "http";
import type { SocketUser, TypingIndicator } from "../types";
import Chat from "../models/Chat";
import Message from "../models/Message";
import User from "../models/User";

const connectedUsers = new Map<string, SocketUser>();
const typingUsers = new Map<string, TypingIndicator>();

export const initializeSocket = (server: HTTPServer) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
    },
  });

  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
      };
      const user = await User.findById(decoded.userId);

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.userId = decoded.userId;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User ${socket.userId} connected`);

    // Add user to connected users
    connectedUsers.set(socket.userId, {
      userId: socket.userId,
      socketId: socket.id,
      isOnline: true,
      lastSeen: new Date(),
    });

    // Join user's chat rooms
    socket.on("join-chats", async () => {
      try {
        const userChats = await Chat.find({ participants: socket.userId });
        userChats.forEach((chat) => {
          socket.join(chat._id.toString());
        });

        // Notify friends that user is online
        socket.broadcast.emit("user-online", socket.userId);
      } catch (error) {
        console.error("Error joining chats:", error);
      }
    });

    // Handle sending messages
    socket.on("send-message", async (data) => {
      try {
        const {
          chatId,
          content,
          messageType = "text",
          mediaUrl,
          mediaMetadata,
          replyTo,
        } = data;

        // Verify user is participant in chat
        const chat = await Chat.findOne({
          _id: chatId,
          participants: socket.userId,
        });

        if (!chat) {
          socket.emit("error", { message: "Chat not found or access denied" });
          return;
        }

        // Create message
        const message = new Message({
          chatId,
          sender: socket.userId,
          content,
          messageType,
          mediaUrl,
          mediaMetadata,
          replyTo,
          readBy: [{ user: socket.userId, readAt: new Date() }],
        });

        await message.save();
        await message.populate("sender", "name profileImage");

        if (replyTo) {
          await message.populate("replyTo", "content sender messageType");
        }

        // Update chat's last message
        chat.lastMessage = message._id as any;
        chat.lastMessageAt = new Date();
        await chat.save();

        // Send message to all participants
        io.to(chatId).emit("new-message", message);

        console.log(`Message sent in chat ${chatId}`);
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Handle typing indicators
    socket.on("typing", (data) => {
      const { chatId, isTyping } = data;

      if (isTyping) {
        typingUsers.set(`${socket.userId}-${chatId}`, {
          chatId,
          userId: socket.userId,
          userName: socket.user.name,
          isTyping: true,
        });
      } else {
        typingUsers.delete(`${socket.userId}-${chatId}`);
      }

      socket.to(chatId).emit("user-typing", {
        userId: socket.userId,
        userName: socket.user.name,
        chatId,
        isTyping,
      });
    });

    // Handle message read receipts
    socket.on("mark-messages-read", async (data) => {
      try {
        const { chatId, messageIds } = data;

        await Message.updateMany(
          {
            _id: { $in: messageIds },
            chatId,
            "readBy.user": { $ne: socket.userId },
          },
          {
            $push: {
              readBy: {
                user: socket.userId,
                readAt: new Date(),
              },
            },
          }
        );

        socket.to(chatId).emit("messages-read", {
          userId: socket.userId,
          messageIds,
          readAt: new Date(),
        });
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User ${socket.userId} disconnected`);

      // Remove from connected users
      connectedUsers.delete(socket.userId);

      // Clear typing indicators
      for (const [key, typing] of typingUsers.entries()) {
        if (typing.userId === socket.userId) {
          typingUsers.delete(key);
          socket.broadcast.emit("user-typing", {
            ...typing,
            isTyping: false,
          });
        }
      }

      // Notify friends that user is offline
      socket.broadcast.emit("user-offline", socket.userId);
    });
  });

  return io;
};

// Extend socket interface
declare module "socket.io" {
  interface Socket {
    userId: string;
    user: any;
  }
}
