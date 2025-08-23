import type { Document } from "mongoose";
import mongoose from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  profileImage?: string;
  headline?: string;
  location?: string;
  coords?: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  lastLocationUpdate?: Date;
  friends: string[];
  friendRequests: {
    sent: string[];
    received: string[];
  };
  isAnonymous: boolean;
  provider: "local" | "google" | "linkedin";
  providerId?: string;
  linkedinUrl?: string;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
  blockedUsers: mongoose.Types.ObjectId[];
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IFriendRequest extends Document {
  from: string;
  to: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
}

export interface LinkedInProfile {
  name: string;
  headline: string;
  link: string;
  position?: string;
  thumbnail?: string;
}

export interface LocationSearchResult {
  profiles: LinkedInProfile[];
  totalResults: number;
  currentPage: number;
  hasNextPage: boolean;
}

export interface NearbyUser {
  _id: string;
  name: string;
  headline?: string;
  profileImage?: string;
  location?: string;
  distance: number;
  bearing?: number; // Direction in degrees (0-360)
  lastVisit?: string; // Human readable time like "5 mins ago"
  isAnonymous: boolean;
}

export interface IMessage extends Document {
  chatId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content: string;
  messageType: "text" | "image" | "video" | "file" | "audio";
  mediaUrl?: string;
  mediaMetadata?: {
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    duration?: number; // for audio/video
  };
  readBy: Array<{
    user: string;
    readAt: Date;
  }>;
  editedAt?: Date;
  deletedAt?: Date;
  replyTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChat extends Document {
  participants: string[];
  chatType: "private" | "group";
  name?: string; // for group chats
  description?: string; // for group chats
  avatar?: string; // for group chats
  admins?: string[]; // for group chats
  lastMessage?: string;
  lastMessageAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationSubscription extends Document {
  userId: mongoose.Types.ObjectId;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: Date;
}

export interface SocketUser {
  userId: string;
  socketId: string;
  isOnline: boolean;
  lastSeen: Date;
}

export interface TypingIndicator {
  chatId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}
