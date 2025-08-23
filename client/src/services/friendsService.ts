import api from "./api"
import type { User, FriendRequest } from "../types"

export interface FriendsResponse {
  friends: User[]
  count: number
}

export interface FriendRequestsResponse {
  requests: FriendRequest[]
  count: number
}

export interface SendRequestResponse {
  requestId: string
  to: string
  status: string
}

export interface AcceptRequestResponse {
  friend: User
}

export const friendsService = {
  // Send friend request
  sendFriendRequest: async (userId: string): Promise<SendRequestResponse> => {
    const response = await api.post(`/friends/request/${userId}`)
    return response.data.data
  },

  // Accept friend request
  acceptFriendRequest: async (requestId: string): Promise<AcceptRequestResponse> => {
    const response = await api.post(`/friends/accept/${requestId}`)
    return response.data.data
  },

  // Reject friend request
  rejectFriendRequest: async (requestId: string): Promise<void> => {
    await api.post(`/friends/reject/${requestId}`)
  },

  // Cancel sent friend request
  cancelFriendRequest: async (requestId: string): Promise<void> => {
    await api.delete(`/friends/request/${requestId}`)
  },

  // Get friends list
  getFriends: async (): Promise<FriendsResponse> => {
    const response = await api.get("/friends")
    return response.data.data
  },

  // Get received friend requests
  getReceivedRequests: async (): Promise<FriendRequestsResponse> => {
    const response = await api.get("/friends/requests/received")
    return response.data.data
  },

  // Get sent friend requests
  getSentRequests: async (): Promise<FriendRequestsResponse> => {
    const response = await api.get("/friends/requests/sent")
    return response.data.data
  },

  // Remove friend
  removeFriend: async (userId: string): Promise<void> => {
    await api.delete(`/friends/${userId}`)
  },

  // Check friendship status
  getFriendshipStatus: async (
    userId: string,
  ): Promise<{
    isFriend: boolean
    hasReceivedRequest: boolean
    hasSentRequest: boolean
    requestId?: string
  }> => {
    try {
      // Get current user's friends and requests
      const [friends, receivedRequests, sentRequests] = await Promise.all([
        friendsService.getFriends(),
        friendsService.getReceivedRequests(),
        friendsService.getSentRequests(),
      ])

      const isFriend = friends.friends.some((friend) => friend.id === userId)
      const receivedRequest = receivedRequests.requests.find((req) => req.from.id === userId)
      const sentRequest = sentRequests.requests.find((req) => req.to.id === userId)

      return {
        isFriend,
        hasReceivedRequest: !!receivedRequest,
        hasSentRequest: !!sentRequest,
        requestId: receivedRequest?.id || sentRequest?.id,
      }
    } catch (error) {
      console.error("Error checking friendship status:", error)
      return {
        isFriend: false,
        hasReceivedRequest: false,
        hasSentRequest: false,
      }
    }
  },
}
