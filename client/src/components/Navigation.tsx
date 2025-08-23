"use client"

import type React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { HomeIcon, UserIcon, UsersIcon, MapPinIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline"
import { useReceivedRequests } from "../hooks/useFriends"
import { removeTokens, getUser } from "../utils/auth"
import toast from "react-hot-toast"

export const Navigation: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const user = getUser()
  const { data: requests } = useReceivedRequests()

  const handleLogout = () => {
    removeTokens()
    toast.success("Logged out successfully")
    navigate("/login")
  }

  const navItems = [
    { path: "/", icon: HomeIcon, label: "Home" },
    { path: "/connect", icon: MapPinIcon, label: "Connect" },
    { path: "/friends", icon: UsersIcon, label: "Friends", badge: requests?.count || 0 },
    { path: "/profile", icon: UserIcon, label: "Profile" },
  ]

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">N</span>
            </div>
            <span className="font-bold text-xl text-foreground">NetworkHub</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              const Icon = item.icon

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                    isActive ? "nav-link-active bg-primary/10" : "nav-link hover:bg-muted"
                  }`}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {item.badge && item.badge > 0 && (
                      <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {item.badge > 9 ? "9+" : item.badge}
                      </span>
                    )}
                  </div>
                  <span className="hidden md:block">{item.label}</span>
                </Link>
              )
            })}

            {/* User Menu */}
            <div className="flex items-center space-x-3 pl-3 border-l border-border">
              <div className="flex items-center space-x-2">
                {user?.profileImage ? (
                  <img
                    src={user.profileImage || "/placeholder.svg"}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground font-medium text-sm">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="hidden md:block text-sm font-medium text-foreground">{user?.name}</span>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
