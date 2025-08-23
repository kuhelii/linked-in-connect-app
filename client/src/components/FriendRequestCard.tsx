"use client"

import type React from "react"
import type { FriendRequest } from "../types"
import { useAcceptFriendRequest, useRejectFriendRequest } from "../hooks/useFriends"
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline"

interface FriendRequestCardProps {
  request: FriendRequest
}

export const FriendRequestCard: React.FC<FriendRequestCardProps> = ({ request }) => {
  const acceptRequest = useAcceptFriendRequest()
  const rejectRequest = useRejectFriendRequest()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return "Yesterday"
    return date.toLocaleDateString()
  }

  return (
    <div className="card">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          {request.from.profileImage ? (
            <img
              src={request.from.profileImage || "/placeholder.svg"}
              alt={request.from.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-gray-600 font-medium text-lg">{request.from.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{request.from.name}</h3>
          {request.from.headline && <p className="text-sm text-gray-500 truncate">{request.from.headline}</p>}
          <p className="text-xs text-gray-400 mt-1">{formatDate(request.createdAt)}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => acceptRequest.mutate(request.id)}
            disabled={acceptRequest.isLoading}
            className="btn-primary px-3 py-1 text-sm"
          >
            <CheckIcon className="w-4 h-4 mr-1" />
            {acceptRequest.isLoading ? "..." : "Accept"}
          </button>
          <button
            onClick={() => rejectRequest.mutate(request.id)}
            disabled={rejectRequest.isLoading}
            className="btn-secondary px-3 py-1 text-sm"
          >
            <XMarkIcon className="w-4 h-4 mr-1" />
            {rejectRequest.isLoading ? "..." : "Reject"}
          </button>
        </div>
      </div>
    </div>
  )
}
