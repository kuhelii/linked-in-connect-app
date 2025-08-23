"use client"

import type React from "react"
import { useParams } from "react-router-dom"
import { useQuery } from "react-query"
import { MapPinIcon, EyeSlashIcon, UsersIcon, CalendarIcon } from "@heroicons/react/24/outline"
import { profileService } from "../services/profileService"
import { FriendButton } from "../components/FriendButton"

export const UserProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  const {
    data: profile,
    isLoading,
    error,
  } = useQuery(["userProfile", id], () => profileService.getProfileById(id!), {
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="card animate-pulse">
          <div className="flex items-center space-x-6">
            <div className="w-32 h-32 bg-muted rounded-full"></div>
            <div className="flex-1 space-y-4">
              <div className="h-8 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="card text-center space-y-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
          <EyeSlashIcon className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Profile not found</h3>
          <p className="text-muted-foreground">This user profile doesn't exist or is not accessible.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="card">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            <div className="relative">
              {profile.profileImage && !profile.isAnonymous ? (
                <img
                  src={profile.profileImage || "/placeholder.svg"}
                  alt={profile.name}
                  className="w-32 h-32 rounded-full object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center">
                  {profile.isAnonymous ? (
                    <EyeSlashIcon className="w-16 h-16 text-muted-foreground" />
                  ) : (
                    <span className="text-muted-foreground font-medium text-4xl">
                      {profile.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              )}
              {profile.isAnonymous && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-muted rounded-full flex items-center justify-center border-2 border-background">
                  <EyeSlashIcon className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-foreground mb-2">{profile.name}</h1>
              {profile.headline && !profile.isAnonymous && (
                <p className="text-lg text-muted-foreground mb-3">{profile.headline}</p>
              )}
              {profile.location && !profile.isAnonymous && (
                <div className="flex items-center justify-center md:justify-start text-muted-foreground mb-4">
                  <MapPinIcon className="w-5 h-5 mr-2" />
                  {profile.location}
                </div>
              )}
              <div className="flex items-center justify-center md:justify-start space-x-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center">
                  <UsersIcon className="w-4 h-4 mr-1" />
                  {profile.friendsCount} connections
                </div>
                <span>•</span>
                <div className="flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  Joined {new Date(profile.createdAt).toLocaleDateString()}
                </div>
              </div>

              {profile.isAnonymous && (
                <div className="bg-muted/50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-center text-muted-foreground">
                    <EyeSlashIcon className="w-5 h-5 mr-2" />
                    <span className="text-sm">This user has chosen to remain anonymous</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {!profile.isAnonymous && (
            <div className="flex justify-center">
              <FriendButton userId={profile.id} userName={profile.name} />
            </div>
          )}
        </div>
      </div>

      {/* Additional Information */}
      {!profile.isAnonymous && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Professional Info */}
          <div className="card">
            <h2 className="text-xl font-bold text-foreground mb-4">Professional Information</h2>
            <div className="space-y-3">
              {profile.headline && (
                <div>
                  <h3 className="font-medium text-foreground">Current Role</h3>
                  <p className="text-muted-foreground">{profile.headline}</p>
                </div>
              )}
              {profile.location && (
                <div>
                  <h3 className="font-medium text-foreground">Location</h3>
                  <p className="text-muted-foreground">{profile.location}</p>
                </div>
              )}
              {profile.linkedinUrl && (
                <div>
                  <h3 className="font-medium text-foreground">LinkedIn Profile</h3>
                  <a
                    href={profile.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 underline"
                  >
                    View LinkedIn Profile
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Network Stats */}
          <div className="card">
            <h2 className="text-xl font-bold text-foreground mb-4">Network</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Connections</span>
                <span className="font-semibold text-foreground">{profile.friendsCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Member since</span>
                <span className="font-semibold text-foreground">
                  {new Date(profile.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
