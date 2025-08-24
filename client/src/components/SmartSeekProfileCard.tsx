import type React from "react";
import { ExternalLink, MapPin, Clock } from "lucide-react";
import type { ProfileResult, UserResult } from "../hooks/useSmartSeek";

interface SmartSeekProfileCardProps {
  profile?: ProfileResult;
  user?: UserResult;
}

export const SmartSeekProfileCard: React.FC<SmartSeekProfileCardProps> = ({
  profile,
  user,
}) => {
  if (profile) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start space-x-3">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
            {profile.thumbnail ? (
              <img
                src={profile.thumbnail || "/placeholder.svg"}
                alt={profile.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-primary font-semibold text-lg">
                  {profile.name.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-card-foreground truncate">
              {profile.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {profile.headline}
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              {profile.position}
            </p>
            <a
              href={profile.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              View LinkedIn Profile
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start space-x-3">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
            {user.profileImage ? (
              <img
                src={user.profileImage || "/placeholder.svg"}
                alt={user.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-primary font-semibold text-lg">
                  {user.name.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-card-foreground truncate">
              {user.name}
            </h3>
            {user.headline && (
              <p className="text-sm text-muted-foreground mb-2">
                {user.headline}
              </p>
            )}
            <div className="flex items-center text-xs text-muted-foreground mb-1">
              <MapPin className="w-3 h-3 mr-1" />
              <span>{user.distance}km away</span>
            </div>
            {user.lastVisit && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="w-3 h-3 mr-1" />
                <span>Last seen {user.lastVisit}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};
