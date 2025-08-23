import api from "./api"
import type { LocationSearchResult, NearbyUser } from "../types"

export interface NearbyUsersResponse {
  users: NearbyUser[]
  count: number
  searchRadius: number
  searchCenter: { lat: number; lng: number }
}

export const connectService = {
  // Search LinkedIn profiles by location
  searchByLocation: async (location: string, role?: string, page = 1): Promise<LocationSearchResult> => {
    const params = new URLSearchParams({
      location,
      page: page.toString(),
    })

    if (role) {
      params.append("role", role)
    }

    const response = await api.get(`/connect/location?${params}`)
    return response.data.data
  },

  // Search LinkedIn profiles by keywords
  searchByKeywords: async (keywords: string, page = 1): Promise<LocationSearchResult> => {
    const params = new URLSearchParams({
      keywords,
      page: page.toString(),
    })

    const response = await api.get(`/connect/search?${params}`)
    return response.data.data
  },

  // Find nearby users
  findNearbyUsers: async (lat: number, lng: number, radius = 10): Promise<NearbyUsersResponse> => {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      radius: radius.toString(),
    })

    const response = await api.get(`/connect/nearby?${params}`)
    return response.data.data
  },

  // Get current location using browser geolocation
  getCurrentLocation: (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser"))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        },
      )
    })
  },
}
