import type React from "react";
import type { FriendRequest } from "../types";
import {
  useAcceptFriendRequest,
  useRejectFriendRequest,
} from "../hooks/useFriends";
import { Check, X, Clock, User } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";

interface FriendRequestCardProps {
  request: FriendRequest;
}

export const FriendRequestCard: React.FC<FriendRequestCardProps> = ({
  request,
}) => {
  const acceptRequest = useAcceptFriendRequest();
  const rejectRequest = useRejectFriendRequest();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  return (
    <Card className="group hover:shadow-md transition-all duration-200 border-l-4 border-l-primary/20 hover:border-l-primary/40">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <Avatar className="w-14 h-14 border-2 border-primary/10">
              <AvatarImage
                src={request.from.profileImage}
                alt={request.from.name}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-primary/10 to-accent/10 text-primary font-semibold">
                {request.from.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-base leading-tight truncate">
                    {request.from.name}
                  </h3>
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 text-xs"
                  >
                    <User className="w-3 h-3" />
                    New Request
                  </Badge>
                </div>

                {request.from.headline && (
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                    {request.from.headline}
                  </p>
                )}

                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(request.createdAt)}</span>
                </div>
              </div>
            </div>

            <Separator className="my-3" />

            <div className="flex gap-2">
              <Button
                onClick={() => acceptRequest.mutate(request._id)}
                disabled={acceptRequest.isLoading || rejectRequest.isLoading}
                size="sm"
                className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
              >
                <Check className="w-4 h-4 mr-2" />
                {acceptRequest.isLoading ? "Accepting..." : "Accept"}
              </Button>

              <Button
                onClick={() => rejectRequest.mutate(request._id)}
                disabled={acceptRequest.isLoading || rejectRequest.isLoading}
                variant="outline"
                size="sm"
                className="flex-1 text-muted-foreground hover:text-destructive hover:border-destructive/20 hover:bg-destructive/5"
              >
                <X className="w-4 h-4 mr-2" />
                {rejectRequest.isLoading ? "Rejecting..." : "Decline"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
