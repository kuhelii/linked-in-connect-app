import type React from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Users,
  UserPlus,
  Globe,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { useReceivedRequests, useFriends } from "../hooks/useFriends";
import { getUser } from "../utils/auth";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Progress } from "../components/ui/progress";

export const HomePage: React.FC = () => {
  const user = getUser();
  const { data: requests } = useReceivedRequests();
  const { data: friends } = useFriends();

  const quickActions = [
    {
      title: "Find Nearby Users",
      description: "Discover professionals in your area",
      icon: MapPin,
      link: "/connect/nearby",
      gradient: "from-blue-500 to-blue-600",
      hoverGradient: "from-blue-600 to-blue-700",
    },
    {
      title: "Search by Location",
      description: "Find LinkedIn profiles by city or region",
      icon: Globe,
      link: "/connect",
      gradient: "from-green-500 to-green-600",
      hoverGradient: "from-green-600 to-green-700",
    },
    {
      title: "View Friends",
      description: `You have ${friends?.count || 0} connections`,
      icon: Users,
      link: "/friends",
      gradient: "from-purple-500 to-purple-600",
      hoverGradient: "from-purple-600 to-purple-700",
    },
    {
      title: "Update Profile",
      description: "Keep your information current",
      icon: UserPlus,
      link: "/profile",
      gradient: "from-orange-500 to-orange-600",
      hoverGradient: "from-orange-600 to-orange-700",
    },
  ];

  const profileCompletionScore = () => {
    let score = 30; // Base score for having an account
    if (user?.name) score += 20;
    if (user?.headline) score += 20;
    if (user?.location) score += 20;
    if (user?.profileImage) score += 10;
    return Math.min(score, 100);
  };

  const completionPercentage = profileCompletionScore();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center space-y-4">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
            Welcome back, {user?.name?.split(" ")[0]}!
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Connect with professionals nearby and expand your network through
            location-based discovery.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
            <div className="text-3xl font-bold text-primary mb-2">
              {friends?.count || 0}
            </div>
            <div className="text-muted-foreground">Connections</div>
          </CardContent>
        </Card>

        <Card className="text-center group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-warning to-warning/80 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-warning-foreground" />
              </div>
            </div>
            <div className="text-3xl font-bold text-warning mb-2">
              {requests?.count || 0}
            </div>
            <div className="text-muted-foreground">Pending Requests</div>
          </CardContent>
        </Card>

        <Card className="text-center group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-success to-success/80 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success-foreground" />
              </div>
            </div>
            <div className="text-3xl font-bold text-success mb-2">
              {completionPercentage}%
            </div>
            <div className="text-muted-foreground">Profile Complete</div>
          </CardContent>
        </Card>
      </div>

      {/* Friend Requests Alert */}
      {requests && requests.count > 0 && (
        <Alert className="border-primary/20 bg-primary/5">
          <UserPlus className="h-4 w-4 text-primary" />
          <AlertTitle className="text-foreground">
            You have {requests.count} pending friend request
            {requests.count > 1 ? "s" : ""}
          </AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Review and respond to connection requests</span>
            <Button asChild size="sm" className="ml-4">
              <Link to="/friends">View Requests</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Profile Completion */}
      {completionPercentage < 100 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Complete Your Profile
            </CardTitle>
            <CardDescription>
              A complete profile helps you connect with more professionals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Profile Completion</span>
              <span className="text-sm text-muted-foreground">
                {completionPercentage}%
              </span>
            </div>
            <Progress value={completionPercentage} className="w-full" />
            <Button asChild variant="outline" size="sm">
              <Link to="/profile">Complete Profile</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card
                key={action.title}
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden"
              >
                <Link to={action.link}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div
                        className={`w-14 h-14 bg-gradient-to-br ${action.gradient} group-hover:bg-gradient-to-br group-hover:${action.hoverGradient} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}
                      >
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                          {action.title}
                        </h3>
                        <p className="text-muted-foreground mt-1 leading-relaxed">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Follow these steps to make the most of NetworkHub
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/30 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary font-semibold text-sm">1</span>
              </div>
              <div className="space-y-1">
                <h4 className="font-medium text-foreground">
                  Complete your profile
                </h4>
                <p className="text-sm text-muted-foreground">
                  Add your photo, headline, and location to help others find you
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant={user?.profileImage ? "default" : "secondary"}>
                    Photo
                  </Badge>
                  <Badge variant={user?.headline ? "default" : "secondary"}>
                    Headline
                  </Badge>
                  <Badge variant={user?.location ? "default" : "secondary"}>
                    Location
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/30 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary font-semibold text-sm">2</span>
              </div>
              <div className="space-y-1">
                <h4 className="font-medium text-foreground">
                  Enable location services
                </h4>
                <p className="text-sm text-muted-foreground">
                  Find and connect with professionals near you
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/30 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary font-semibold text-sm">3</span>
              </div>
              <div className="space-y-1">
                <h4 className="font-medium text-foreground">
                  Start connecting
                </h4>
                <p className="text-sm text-muted-foreground">
                  Send friend requests and build your professional network
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
