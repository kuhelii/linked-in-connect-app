import { useQuery, useMutation, useQueryClient } from "react-query";
import { friendsService } from "../services/friendsService";
import toast from "react-hot-toast";

export const useFriends = () => {
  return useQuery("friends", friendsService.getFriends, {
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useReceivedRequests = () => {
  return useQuery("receivedRequests", friendsService.getReceivedRequests, {
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useSentRequests = () => {
  return useQuery("sentRequests", friendsService.getSentRequests, {
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useFriendshipStatus = (userId: string) => {
  return useQuery(
    ["friendshipStatus", userId],
    () => friendsService.getFriendshipStatus(userId),
    {
      enabled: !!userId,
      staleTime: 30 * 1000, // 30 seconds
    }
  );
};

export const useSendFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation(friendsService.sendFriendRequest, {
    onSuccess: (data) => {
      toast.success(`Friend request sent to ${data.to}`);
      queryClient.invalidateQueries("sentRequests");
      queryClient.invalidateQueries(["friendshipStatus"]);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || "Failed to send friend request"
      );
    },
  });
};

export const useAcceptFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation(friendsService.acceptFriendRequest, {
    onSuccess: (data) => {
      console.log("Friend request accepted:", data);
      toast.success(`You are now friends with ${data.friend.name}`);
      queryClient.invalidateQueries("friends");
      queryClient.invalidateQueries("receivedRequests");
      queryClient.invalidateQueries(["friendshipStatus"]);
    },
    onError: (error: any) => {
      console.log("Failed to accept friend request:", error);
      toast.error(
        error.response?.data?.error || "Failed to accept friend request"
      );
    },
  });
};

export const useRejectFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation(friendsService.rejectFriendRequest, {
    onSuccess: () => {
      toast.success("Friend request rejected");
      queryClient.invalidateQueries("receivedRequests");
      queryClient.invalidateQueries(["friendshipStatus"]);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || "Failed to reject friend request"
      );
    },
  });
};

export const useCancelFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation(friendsService.cancelFriendRequest, {
    onSuccess: () => {
      toast.success("Friend request cancelled");
      queryClient.invalidateQueries("sentRequests");
      queryClient.invalidateQueries(["friendshipStatus"]);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || "Failed to cancel friend request"
      );
    },
  });
};

export const useRemoveFriend = () => {
  const queryClient = useQueryClient();

  return useMutation(friendsService.removeFriend, {
    onSuccess: () => {
      toast.success("Friend removed");
      queryClient.invalidateQueries("friends");
      queryClient.invalidateQueries(["friendshipStatus"]);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to remove friend");
    },
  });
};
