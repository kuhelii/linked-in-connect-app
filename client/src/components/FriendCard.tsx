"use client"

import type React from "react"
import { Link } from "react-router-dom"
import type { User } from "../types"
import { useRemoveFriend } from "../hooks/useFriends"
import { UserMinusIcon, MapPinIcon } from "@heroicons/react/24/outline"

interface FriendCardProps {
  friend: User
  showRemoveButton?: boolean
}

export const FriendCard: React.FC<FriendCardProps> = ({ friend, showRemoveButton = false }) => {
  const removeFriend = useRemoveFriend()

  return (
    <div className="card">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          {friend.profileImage && !friend.isAnonymous ? (
            <img
              src={friend.profileImage || "/placeholder.svg"}
              alt={friend.name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-gray-600 font-medium text-xl">{friend.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <Link
            to={`/profile/${friend.id}`}
            className="font-medium text-gray-900 hover:text-primary-600 truncate block"
          >
            {friend.name}
          </Link>
          {friend.headline && !friend.isAnonymous && (
            <p className="text-sm text-gray-500 truncate mt-1">{friend.headline}</p>
          )}
          {friend.location && !friend.isAnonymous && (
            <div className="flex items-center text-xs text-gray-400 mt-1">
              <MapPinIcon className="w-3 h-3 mr-1" />
              {friend.location}
            </div>
          )}
        </div>

        {showRemoveButton && (
          <button
            onClick={() => removeFriend.mutate(friend.id)}
            disabled={removeFriend.isLoading}
            className="btn-secondary px-3 py-1 text-sm hover:bg-red-100 hover:text-red-700"
          >
            <UserMinusIcon className="w-4 h-4 mr-1" />
            {removeFriend.isLoading ? "..." : "Remove"}
          </button>
        )}
      </div>
    </div>
  )
}
