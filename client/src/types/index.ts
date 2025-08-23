export interface User {
  createdAt: string | number | Date;
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  headline?: string;
  location?: string;
  isAnonymous: boolean;
  friendsCount?: number;
  linkedinUrl?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
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

export interface FriendRequest {
  _id: string;
  from: User;
  to: User;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}
