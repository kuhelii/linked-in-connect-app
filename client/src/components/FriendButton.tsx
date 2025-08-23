import type React from "react";
import {
  useFriendshipStatus,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useRejectFriendRequest,
  useCancelFriendRequest,
  useRemoveFriend,
} from "../hooks/useFriends";
import { UserPlus, UserMinus, Check, X, Clock, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

interface FriendButtonProps {
  userId: string;
  userName: string;
  className?: string;
}

export const FriendButton: React.FC<FriendButtonProps> = ({
  userId,
  userName,
  className = "",
}) => {
  const { data: status, isLoading } = useFriendshipStatus(userId);
  const sendRequest = useSendFriendRequest();
  const acceptRequest = useAcceptFriendRequest();
  const rejectRequest = useRejectFriendRequest();
  const cancelRequest = useCancelFriendRequest();
  const removeFriend = useRemoveFriend();

  if (isLoading) {
    return (
      <Button disabled variant="outline" className={className}>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (!status) return null;

  // Already friends
  if (status.isFriend) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            className={`hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 ${className}`}
          >
            <UserMinus className="w-4 h-4 mr-2" />
            Remove Friend
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Friend</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{userName}</strong> from
              your friends list? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeFriend.mutate(userId)}
              disabled={removeFriend.isLoading}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {removeFriend.isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Friend"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Has received request from this user
  if (status.hasReceivedRequest && status.requestId) {
    return (
      <div className={`flex gap-2 ${className}`}>
        <Button
          onClick={() => acceptRequest.mutate(status.requestId!)}
          disabled={acceptRequest.isLoading}
          className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
        >
          {acceptRequest.isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Check className="w-4 h-4 mr-2" />
          )}
          {acceptRequest.isLoading ? "Accepting..." : "Accept"}
        </Button>
        <Button
          onClick={() => rejectRequest.mutate(status.requestId!)}
          disabled={rejectRequest.isLoading}
          variant="outline"
          size="icon"
          className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
        >
          {rejectRequest.isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <X className="w-4 h-4" />
          )}
        </Button>
      </div>
    );
  }

  // Has sent request to this user
  if (status.hasSentRequest && status.requestId) {
    return (
      <Button
        onClick={() => cancelRequest.mutate(status.requestId!)}
        disabled={cancelRequest.isLoading}
        variant="outline"
        className={className}
      >
        {cancelRequest.isLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Clock className="w-4 h-4 mr-2" />
        )}
        {cancelRequest.isLoading ? "Cancelling..." : "Request Sent"}
      </Button>
    );
  }

  // Can send friend request
  return (
    <Button
      onClick={() => sendRequest.mutate(userId)}
      disabled={sendRequest.isLoading}
      className={className}
    >
      {sendRequest.isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <UserPlus className="w-4 h-4 mr-2" />
      )}
      {sendRequest.isLoading ? "Sending..." : "Add Friend"}
    </Button>
  );
};
