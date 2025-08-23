import api from "./api"
import type { User } from "../types"

export interface ProfileUpdateData {
  name?: string
  headline?: string
  location?: string
  isAnonymous?: boolean
  coords?: { lat: number; lng: number }
  profileImage?: File
}

export const profileService = {
  // Get current user profile
  getCurrentProfile: async (): Promise<User> => {
    const response = await api.get("/profile")
    return response.data.data
  },

  // Get user profile by ID
  getProfileById: async (userId: string): Promise<User> => {
    const response = await api.get(`/profile/${userId}`)
    return response.data.data
  },

  // Update current user profile
  updateProfile: async (data: ProfileUpdateData): Promise<User> => {
    const formData = new FormData()

    // Add text fields
    Object.entries(data).forEach(([key, value]) => {
      if (key === "profileImage" && value instanceof File) {
        formData.append("profileImage", value)
      } else if (key === "coords" && value) {
        formData.append("coords", JSON.stringify(value))
      } else if (value !== undefined && value !== null) {
        formData.append(key, value.toString())
      }
    })

    const response = await api.put("/profile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })

    return response.data.data
  },
}
