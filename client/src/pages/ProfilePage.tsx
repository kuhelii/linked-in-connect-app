import React from "react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useForm } from "react-hook-form";
import {
  CameraIcon,
  MapPinIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { profileService } from "../services/profileService";
import { connectService } from "../services/connectService";
import toast from "react-hot-toast";

interface ProfileForm {
  name: string;
  headline: string;
  location: string;
  isAnonymous: boolean;
}

export const ProfilePage: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery(
    "currentProfile",
    profileService.getCurrentProfile
  );

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
  });

  const updateProfileMutation = useMutation(profileService.updateProfile, {
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      queryClient.invalidateQueries("currentProfile");
      setIsEditing(false);
      setSelectedImage(null);
      setImagePreview(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update profile");
    },
  });

  React.useEffect(() => {
    if (profile) {
      setValue("name", profile.name);
      setValue("headline", profile.headline || "");
      setValue("location", profile.location || "");
      setValue("isAnonymous", profile.isAnonymous);
    }
  }, [profile, setValue]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const coords = await connectService.getCurrentLocation();
      setValue(
        "location",
        `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
      );
      toast.success("Location updated!");
    } catch (error) {
      toast.error("Unable to get your location");
    } finally {
      setIsGettingLocation(false);
    }
  };

  const onSubmit = async (data: ProfileForm) => {
    const updateData: any = {
      name: data.name,
      headline: data.headline,
      location: data.location,
      isAnonymous: data.isAnonymous,
    };

    if (selectedImage) {
      updateData.profileImage = selectedImage;
    }

    updateProfileMutation.mutate(updateData);
  };

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-gray-100 rounded-lg"></div>;
  }

  if (!profile) {
    return (
      <div className="text-center text-red-500 font-medium mt-10">
        Failed to load profile
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 space-y-8 bg-white rounded-2xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500">
          Update your information and control your visibility
        </p>
      </div>

      {/* Profile Card */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
        {/* Profile Image */}
        <div className="relative group">
          {imagePreview || profile.profileImage ? (
            <img
              src={imagePreview || profile.profileImage || "/placeholder.svg"}
              alt="Profile"
              className="w-36 h-36 md:w-40 md:h-40 rounded-full object-cover shadow-md"
            />
          ) : (
            <div className="w-36 h-36 md:w-40 md:h-40 rounded-full bg-gray-100 flex items-center justify-center shadow-md">
              <span className="text-gray-400 text-5xl font-bold">
                {profile.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {profile.isAnonymous && (
            <div className="absolute top-0 right-0 bg-gray-100 p-1 rounded-full shadow-md">
              <EyeSlashIcon className="w-5 h-5 text-gray-500" />
            </div>
          )}

          {isEditing && (
            <label className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full cursor-pointer transition-transform transform group-hover:scale-110">
              <CameraIcon className="w-5 h-5 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Profile Details */}
        <div className="flex-1 space-y-4 w-full">
          {!isEditing ? (
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-gray-900">
                {profile.name}
              </h2>
              {profile.headline && (
                <p className="text-gray-600">{profile.headline}</p>
              )}
              {profile.location && (
                <div className="flex items-center text-gray-500">
                  <MapPinIcon className="w-5 h-5 mr-1" />
                  {profile.location}
                </div>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{profile.friendsCount} connections</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  {profile.isAnonymous ? (
                    <EyeSlashIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                  {profile.isAnonymous ? "Anonymous" : "Public"}
                </span>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="mt-4 px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow hover:bg-blue-600 transition"
              >
                Edit Profile
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4 bg-gray-50 p-4 rounded-lg shadow-inner"
            >
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Full Name
                </label>
                <input
                  {...register("name", { required: "Name is required" })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Professional Headline
                </label>
                <input
                  {...register("headline")}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                  placeholder="Software Engineer at Company"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Location
                </label>
                <div className="flex gap-2">
                  <input
                    {...register("location")}
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                    placeholder="Enter your location"
                  />
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className="px-3 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                  >
                    <MapPinIcon className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  {...register("isAnonymous")}
                  type="checkbox"
                  id="isAnonymous"
                  className="rounded"
                />
                <label htmlFor="isAnonymous" className="text-gray-700 text-sm">
                  Make my profile anonymous
                </label>
              </div>

              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateProfileMutation.isLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  {updateProfileMutation.isLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

