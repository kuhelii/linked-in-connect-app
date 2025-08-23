import type React from "react";
import { Link } from "react-router-dom";
import type { User } from "../types";
import { useRemoveFriend } from "../hooks/useFriends";
import { UserMinus, MapPin, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
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

interface FriendCardProps {
  friend: User;
  showRemoveButton?: boolean;
}

export const FriendCard: React.FC<FriendCardProps> = ({
  friend,
  showRemoveButton = false,
}) => {
  const removeFriend = useRemoveFriend();

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 bg-gradient-to-br from-card to-card/80">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <Avatar className="w-16 h-16 border-2 border-primary/10 group-hover:border-primary/20 transition-colors">
              <AvatarImage
                src={friend.profileImage}
                alt={friend.name}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-primary/10 to-accent/10 text-primary font-semibold text-lg">
                {friend.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <Link
                  to={`/profile/${friend.id}`}
                  className="group/link flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <h3 className="font-semibold text-lg leading-tight truncate group-hover/link:text-primary">
                    {friend.name}
                  </h3>
                  <ExternalLink className="w-4 h-4 opacity-0 group-hover/link:opacity-100 transition-opacity flex-shrink-0" />
                </Link>

                {friend.headline && !friend.isAnonymous && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {friend.headline}
                  </p>
                )}
              </div>

              {friend.isAnonymous && (
                <Badge variant="secondary" className="flex-shrink-0 text-xs">
                  Anonymous
                </Badge>
              )}
            </div>

            {friend.location && !friend.isAnonymous && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{friend.location}</span>
              </div>
            )}

            {showRemoveButton && (
              <div className="pt-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                    >
                      <UserMinus className="w-4 h-4 mr-2" />
                      Remove Friend
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Friend</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove{" "}
                        <strong>{friend.name}</strong> from your friends list?
                        This action cannot be undone, but you can send them a
                        friend request again later.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => removeFriend.mutate(friend.id)}
                        disabled={removeFriend.isLoading}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                      >
                        {removeFriend.isLoading
                          ? "Removing..."
                          : "Remove Friend"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
