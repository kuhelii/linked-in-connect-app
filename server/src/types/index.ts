import type { Document } from "mongoose";

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
  isAnonymous: boolean;
}
