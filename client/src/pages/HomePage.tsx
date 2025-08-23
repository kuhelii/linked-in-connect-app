import type React from "react"
import { Link } from "react-router-dom"
import { MapPinIcon, UsersIcon, UserPlusIcon, GlobeAltIcon } from "@heroicons/react/24/outline"
import { useReceivedRequests, useFriends } from "../hooks/useFriends"
import { getUser } from "../utils/auth"

export const HomePage: React.FC = () => {
  const user = getUser()
  const { data: requests } = useReceivedRequests()
  const { data: friends } = useFriends()

  const quickActions = [
    {
      title: "Find Nearby Users",
      description: "Discover professionals in your area",
      icon: MapPinIcon,
      link: "/connect/nearby",
      color: "bg-blue-500",
    },
    {
      title: "Search by Location",
      description: "Find LinkedIn profiles by city or region",
      icon: GlobeAltIcon,
      link: "/connect",
      color: "bg-green-500",
    },
    {
      title: "View Friends",
      description: `You have ${friends?.count || 0} connections`,
      icon: UsersIcon,
      link: "/friends",
      color: "bg-purple-500",
    },
    {
      title: "Update Profile",
      description: "Keep your information current",
      icon: UserPlusIcon,
      link: "/profile",
      color: "bg-orange-500",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">Welcome back, {user?.name?.split(" ")[0]}!</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Connect with professionals nearby and expand your network through location-based discovery.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary mb-2">{friends?.count || 0}</div>
          <div className="text-muted-foreground">Connections</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary mb-2">{requests?.count || 0}</div>
          <div className="text-muted-foreground">Pending Requests</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary mb-2">{user?.isAnonymous ? "Anonymous" : "Public"}</div>
          <div className="text-muted-foreground">Profile Status</div>
        </div>
      </div>

      {/* Friend Requests Alert */}
      {requests && requests.count > 0 && (
        <div className="card bg-primary/10 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <UserPlusIcon className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  You have {requests.count} pending friend request{requests.count > 1 ? "s" : ""}
                </h3>
                <p className="text-muted-foreground">Review and respond to connection requests</p>
              </div>
            </div>
            <Link to="/friends" className="btn-primary">
              View Requests
            </Link>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.title} to={action.link} className="card hover:shadow-md transition-shadow group">
                <div className="flex items-start space-x-4">
                  <div
                    className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-muted-foreground mt-1">{action.description}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">Getting Started</h2>
        <div className="card">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-primary font-semibold text-sm">1</span>
              </div>
              <div>
                <h4 className="font-medium text-foreground">Complete your profile</h4>
                <p className="text-sm text-muted-foreground">Add your photo, headline, and location</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-primary font-semibold text-sm">2</span>
              </div>
              <div>
                <h4 className="font-medium text-foreground">Enable location services</h4>
                <p className="text-sm text-muted-foreground">Find professionals near you</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-primary font-semibold text-sm">3</span>
              </div>
              <div>
                <h4 className="font-medium text-foreground">Start connecting</h4>
                <p className="text-sm text-muted-foreground">Send friend requests and build your network</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
