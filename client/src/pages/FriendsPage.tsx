"use client"

import type React from "react"
import { useState } from "react"
import { UsersIcon, UserPlusIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline"
import { useFriends, useReceivedRequests, useSentRequests } from "../hooks/useFriends"
import { FriendCard } from "../components/FriendCard"
import { FriendRequestCard } from "../components/FriendRequestCard"

type TabType = "friends" | "received" | "sent"

export const FriendsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("friends")
  const { data: friends, isLoading: friendsLoading } = useFriends()
  const { data: receivedRequests, isLoading: receivedLoading } = useReceivedRequests()
  const { data: sentRequests, isLoading: sentLoading } = useSentRequests()

  const tabs = [
    {
      id: "friends" as TabType,
      label: "Friends",
      icon: UsersIcon,
      count: friends?.count || 0,
    },
    {
      id: "received" as TabType,
      label: "Requests",
      icon: UserPlusIcon,
      count: receivedRequests?.count || 0,
    },
    {
      id: "sent" as TabType,
      label: "Sent",
      icon: PaperAirplaneIcon,
      count: sentRequests?.count || 0,
    },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case "friends":
        if (friendsLoading) {
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        }

        if (!friends || friends.friends.length === 0) {
          return (
            <div className="card text-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <UsersIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No friends yet</h3>
                <p className="text-muted-foreground mb-4">Start connecting with professionals to build your network.</p>
              </div>
            </div>
          )
        }

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {friends.friends.map((friend) => (
              <FriendCard key={friend.id} friend={friend} showRemoveButton />
            ))}
          </div>
        )

      case "received":
        if (receivedLoading) {
          return (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="w-16 h-8 bg-muted rounded"></div>
                      <div className="w-16 h-8 bg-muted rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        }

        if (!receivedRequests || receivedRequests.requests.length === 0) {
          return (
            <div className="card text-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <UserPlusIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No pending requests</h3>
                <p className="text-muted-foreground">You don't have any friend requests at the moment.</p>
              </div>
            </div>
          )
        }

        return (
          <div className="space-y-4">
            {receivedRequests.requests.map((request) => (
              <FriendRequestCard key={request.id} request={request} />
            ))}
          </div>
        )

      case "sent":
        if (sentLoading) {
          return (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        }

        if (!sentRequests || sentRequests.requests.length === 0) {
          return (
            <div className="card text-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <PaperAirplaneIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No sent requests</h3>
                <p className="text-muted-foreground">You haven't sent any friend requests yet.</p>
              </div>
            </div>
          )
        }

        return (
          <div className="space-y-4">
            {sentRequests.requests.map((request) => (
              <div key={request.id} className="card">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {request.to.profileImage ? (
                      <img
                        src={request.to.profileImage || "/placeholder.svg"}
                        alt={request.to.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground font-medium text-lg">
                          {request.to.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">{request.to.name}</h3>
                    {request.to.headline && (
                      <p className="text-sm text-muted-foreground truncate">{request.to.headline}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Sent {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
              </div>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">Friends & Connections</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Manage your professional network and friend requests
        </p>
      </div>

      {/* Tabs */}
      <div className="card p-0">
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">
          {/* Left navigation / summary */}
          <aside className="border-r border-border p-4 space-y-4 bg-card/50">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Overview</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Connections</div>
                  <div className="text-lg font-bold text-foreground">{friends?.count || 0}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Requests</div>
                  <div className="text-lg font-bold text-foreground">{receivedRequests?.count || 0}</div>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition ${
                        isActive
                          ? "bg-primary/10 text-primary ring-1 ring-primary/10"
                          : "text-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="flex-1 text-left">{tab.label}</span>
                      {tab.count > 0 && (
                        <span className={`text-xs px-2 py-1 rounded-full ${isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </nav>
            </div>
          </aside>

          {/* Content area */}
          <main className="p-6">{renderContent()}</main>
        </div>
      </div>
    </div>
  )
}
