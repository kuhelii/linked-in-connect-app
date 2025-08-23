import { useQuery, useMutation, useQueryClient } from "react-query"
import { profileService } from "../services/profileService"
import toast from "react-hot-toast"

export const useCurrentProfile = () => {
  return useQuery("currentProfile", profileService.getCurrentProfile, {
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useUserProfile = (userId: string) => {
  return useQuery(["userProfile", userId], () => profileService.getProfileById(userId), {
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()

  return useMutation(profileService.updateProfile, {
    onSuccess: () => {
      toast.success("Profile updated successfully!")
      queryClient.invalidateQueries("currentProfile")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update profile")
    },
  })
}
