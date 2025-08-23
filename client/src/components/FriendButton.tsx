"use client"

import type React from "react"
import {
  useFriendshipStatus,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useRejectFriendRequest,
  useCancelFriendRequest,
  useRemoveFriend,
} from "../hooks/useFriends"
import { UserPlusIcon, UserMinusIcon, CheckIcon, XMarkIcon, ClockIcon } from "@heroicons/react/24/outline"

interface FriendButtonProps {
  userId: string
  userName: string
  className?: string
}

export const FriendButton: React.FC<FriendButtonProps> = ({ userId, userName, className = "" }) => {
  const { data: status, isLoading } = useFriendshipStatus(userId)
  const sendRequest = useSendFriendRequest()
  const acceptRequest = useAcceptFriendRequest()
  const rejectRequest = useRejectFriendRequest()
  const cancelRequest = useCancelFriendRequest()
  const removeFriend = useRemoveFriend()

  if (isLoading) {
    return (
      <button disabled className={`btn-secondary opacity-50 ${className}`}>
        <ClockIcon className="w-4 h-4 mr-2" />
        Loading...
      </button>
    )
  }

  if (!status) return null

  // Already friends
  if (status.isFriend) {
    return (
      <button
        onClick={() => removeFriend.mutate(userId)}
        disabled={removeFriend.isLoading}
        className={`btn-secondary hover:bg-red-100 hover:text-red-700 ${className}`}
      >
        <UserMinusIcon className="w-4 h-4 mr-2" />
        {removeFriend.isLoading ? "Removing..." : "Remove Friend"}
      </button>
    )
  }

  // Has received request from this user
  if (status.hasReceivedRequest && status.requestId) {
    return (
      <div className={`flex gap-2 ${className}`}>
        <button
          onClick={() => acceptRequest.mutate(status.requestId!)}
          disabled={acceptRequest.isLoading}
          className="btn-primary flex-1"
        >
          <CheckIcon className="w-4 h-4 mr-2" />
          {acceptRequest.isLoading ? "Accepting..." : "Accept"}
        </button>
        <button
          onClick={() => rejectRequest.mutate(status.requestId!)}
          disabled={rejectRequest.isLoading}
          className="btn-secondary"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    )
  }

  // Has sent request to this user
  if (status.hasSentRequest && status.requestId) {
    return (
      <button
        onClick={() => cancelRequest.mutate(status.requestId!)}
        disabled={cancelRequest.isLoading}
        className={`btn-secondary ${className}`}
      >
        <ClockIcon className="w-4 h-4 mr-2" />
        {cancelRequest.isLoading ? "Cancelling..." : "Request Sent"}
      </button>
    )
  }

  // Can send friend request
  return (
    <button
      onClick={() => sendRequest.mutate(userId)}
      disabled={sendRequest.isLoading}
      className={`btn-primary ${className}`}
    >
      <UserPlusIcon className="w-4 h-4 mr-2" />
      {sendRequest.isLoading ? "Sending..." : "Add Friend"}
    </button>
  )
}
