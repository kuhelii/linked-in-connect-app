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
      {/* Hero - two column */}
      <div className="bg-gradient-to-br from-primary/6 to-accent/6 rounded-2xl p-6 md:p-8 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 text-center md:text-left space-y-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight">
              Welcome back, {user?.name?.split(" ")[0]}!
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Discover professionals nearby, manage requests, and keep your profile
              up-to-date to grow your network.
            </p>
            <div className="flex items-center justify-center md:justify-start gap-3">
              <Button asChild>
                <Link to="/connect/nearby">Find Nearby</Link>
              </Button>
              <Button asChild variant="outline" className="hidden sm:inline-flex">
                <Link to="/profile">Edit Profile</Link>
              </Button>
            </div>
          </div>

          {/* Compact stats on the right */}
          <div className="w-full md:w-96 grid grid-cols-3 gap-3">
            <div className="bg-card/60 rounded-lg p-3 text-center shadow-sm">
              <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="text-lg font-bold text-primary">{friends?.count || 0}</div>
              <div className="text-xs text-muted-foreground">Connections</div>
            </div>

            <div className="bg-card/60 rounded-lg p-3 text-center shadow-sm">
              <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-warning to-warning/80 flex items-center justify-center mb-2">
                <AlertCircle className="w-5 h-5 text-warning-foreground" />
              </div>
              <div className="text-lg font-bold text-warning">{requests?.count || 0}</div>
              <div className="text-xs text-muted-foreground">Requests</div>
            </div>

            <div className="bg-card/60 rounded-lg p-3 text-center shadow-sm">
              <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-success to-success/80 flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-success-foreground" />
              </div>
              <div className="text-lg font-bold text-success">{completionPercentage}%</div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
          </div>
        </div>
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
        <h2 className="text-2xl font-bold text-foreground mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} to={action.link} className="block relative group">

                <div className="relative z-10 rounded-xl p-4 bg-card/60 hover:bg-card/80 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1">
                  <div className="flex items-start gap-4">
                    {/* small left logo (always visible) */}
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br ${action.gradient} z-20`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">{action.title}</h3>
                      <p className="text-muted-foreground mt-1 leading-relaxed">{action.description}</p>
                    </div>
                    <div className="hidden md:flex items-center text-sm text-muted-foreground">Go</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle className="font-bold">Getting Started</CardTitle>
          <CardDescription className="font-medium">Three simple steps to start connecting</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-6 bottom-6 w-px bg-border/40" />

            <div className="space-y-6 pl-10">
              {/* Step 1 */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold">1</div>
                </div>
                <div className="flex-1 bg-card/50 p-4 rounded-lg shadow-sm hover:shadow-md transition">
                  <h4 className="font-bold text-foreground">Complete your profile</h4>
                  <p className="text-sm text-muted-foreground mt-1">Add a photo, headline, and location so others can find you.</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant={user?.profileImage ? "default" : "secondary"}>Photo</Badge>
                    <Badge variant={user?.headline ? "default" : "secondary"}>Headline</Badge>
                    <Badge variant={user?.location ? "default" : "secondary"}>Location</Badge>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center text-white font-bold">2</div>
                </div>
                <div className="flex-1 bg-card/50 p-4 rounded-lg shadow-sm hover:shadow-md transition">
                  <h4 className="font-bold text-foreground">Enable location</h4>
                  <p className="text-sm text-muted-foreground mt-1">Turn on location services to discover nearby professionals.</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold">3</div>
                </div>
                <div className="flex-1 bg-card/50 p-4 rounded-lg shadow-sm hover:shadow-md transition">
                  <h4 className="font-bold text-foreground">Start connecting</h4>
                  <p className="text-sm text-muted-foreground mt-1">Search profiles and send connection requests to build your network.</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
