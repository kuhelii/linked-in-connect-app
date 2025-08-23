"use client"

import React from "react"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "react-query"
import { useForm } from "react-hook-form"
import { CameraIcon, MapPinIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"
import { profileService } from "../services/profileService"
import { connectService } from "../services/connectService"
import toast from "react-hot-toast"

interface ProfileForm {
  name: string
  headline: string
  location: string
  isAnonymous: boolean
}

export const ProfilePage: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const queryClient = useQueryClient()

  const { data: profile, isLoading } = useQuery("currentProfile", profileService.getCurrentProfile)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileForm>({
    defaultValues: {
      name: profile?.name || "",
      headline: profile?.headline || "",
      location: profile?.location || "",
      isAnonymous: profile?.isAnonymous || false,
    },
  })

  const updateProfileMutation = useMutation(profileService.updateProfile, {
    onSuccess: () => {
      toast.success("Profile updated successfully!")
      queryClient.invalidateQueries("currentProfile")
      setIsEditing(false)
      setSelectedImage(null)
      setImagePreview(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update profile")
    },
  })

  // Set form values when profile loads
  React.useEffect(() => {
    if (profile) {
      setValue("name", profile.name)
      setValue("headline", profile.headline || "")
      setValue("location", profile.location || "")
      setValue("isAnonymous", profile.isAnonymous)
    }
  }, [profile, setValue])

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB")
        return
      }
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const getCurrentLocation = async () => {
    setIsGettingLocation(true)
    try {
      const coords = await connectService.getCurrentLocation()
      // You could reverse geocode here to get a readable location
      setValue("location", `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`)
      toast.success("Location updated!")
    } catch (error) {
      toast.error("Unable to get your location")
    } finally {
      setIsGettingLocation(false)
    }
  }

  const onSubmit = async (data: ProfileForm) => {
    const updateData: any = {
      name: data.name,
      headline: data.headline,
      location: data.location,
      isAnonymous: data.isAnonymous,
    }

    if (selectedImage) {
      updateData.profileImage = selectedImage
    }

    updateProfileMutation.mutate(updateData)
  }

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

  if (!profile) {
    return (
      <div className="card text-center">
        <p className="text-destructive">Failed to load profile</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">My Profile</h1>
        <p className="text-xl text-muted-foreground">Manage your professional information and privacy settings</p>
      </div>

      {/* Profile Card */}
      <div className="card">
        {!isEditing ? (
          // View Mode
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
              <div className="relative">
                {profile.profileImage ? (
                  <img
                    src={profile.profileImage || "/placeholder.svg"}
                    alt={profile.name}
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground font-medium text-4xl">
                      {profile.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                {profile.isAnonymous && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-muted rounded-full flex items-center justify-center border-2 border-background">
                    <EyeSlashIcon className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-bold text-foreground mb-2">{profile.name}</h2>
                {profile.headline && <p className="text-lg text-muted-foreground mb-3">{profile.headline}</p>}
                {profile.location && (
                  <div className="flex items-center justify-center md:justify-start text-muted-foreground mb-4">
                    <MapPinIcon className="w-5 h-5 mr-2" />
                    {profile.location}
                  </div>
                )}
                <div className="flex items-center justify-center md:justify-start space-x-4 text-sm text-muted-foreground">
                  <span>{profile.friendsCount} connections</span>
                  <span>•</span>
                  <span className="flex items-center">
                    {profile.isAnonymous ? (
                      <EyeSlashIcon className="w-4 h-4 mr-1" />
                    ) : (
                      <EyeIcon className="w-4 h-4 mr-1" />
                    )}
                    {profile.isAnonymous ? "Anonymous" : "Public"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button onClick={() => setIsEditing(true)} className="btn-primary">
                Edit Profile
              </button>
            </div>
          </div>
        ) : (
          // Edit Mode
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
              <div className="relative">
                {imagePreview || profile.profileImage ? (
                  <img
                    src={imagePreview || profile.profileImage || "/placeholder.svg"}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground font-medium text-4xl">
                      {watch("name")?.charAt(0).toUpperCase() || "?"}
                    </span>
                  </div>
                )}
                <label className="absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                  <CameraIcon className="w-5 h-5 text-primary-foreground" />
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              </div>

              <div className="flex-1 space-y-4 w-full">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                  <input
                    {...register("name", { required: "Name is required" })}
                    className="input-field"
                    placeholder="Enter your full name"
                  />
                  {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Professional Headline</label>
                  <input
                    {...register("headline")}
                    className="input-field"
                    placeholder="e.g., Software Engineer at Tech Company"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Location</label>
                  <div className="flex space-x-2">
                    <input {...register("location")} className="input-field flex-1" placeholder="Enter your location" />
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={isGettingLocation}
                      className="btn-outline px-3"
                    >
                      <MapPinIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <input {...register("isAnonymous")} type="checkbox" id="isAnonymous" className="rounded" />
                  <label htmlFor="isAnonymous" className="text-sm font-medium text-foreground">
                    Make my profile anonymous (hide personal information from nearby users)
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  setSelectedImage(null)
                  setImagePreview(null)
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" disabled={updateProfileMutation.isLoading} className="btn-primary">
                {updateProfileMutation.isLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
