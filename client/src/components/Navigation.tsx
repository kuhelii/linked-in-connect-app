import type React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  HomeIcon,
  UserIcon,
  UsersIcon,
  MapPinIcon,
  LogOut,
  User2,
  ChevronDown,
} from "lucide-react";
import { useReceivedRequests } from "../hooks/useFriends";
import { removeTokens, getUser } from "../utils/auth";
import toast from "react-hot-toast";
import { useState, useRef, useEffect } from "react";
import Logo from "./Logo";
import {
  ChatBubbleLeftRightIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

export const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getUser();
  const { data: requests } = useReceivedRequests();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    removeTokens();
    toast.success("Logged out successfully meow");
    navigate("/login");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const navItems = [
    { path: "/", icon: HomeIcon, label: "Home" },
    { path: "/connect", icon: MapPinIcon, label: "Connect" },
    {
      path: "/friends",
      icon: UsersIcon,
      label: "Friends",
      badge: requests?.count && requests.count > 0 ? requests.count : undefined,
    },
    { path: "/chat", icon: ChatBubbleLeftRightIcon, label: "Messages" },
    { path: "/smartseek", icon: SparklesIcon, label: "SmartSeek" },

    { path: "/profile", icon: UserIcon, label: "Profile" },
  ];

  return (
    <nav className="sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between py-3">
         {/* Logo */}
<Link to="/" className="flex items-center rounded-full bg-white py-2 px-4 shadow-md space-x-2 group" title="ConnectiN">
  <Logo size="md" />
</Link>


          {/* Center nav - pill style */}
          <div className="hidden md:flex items-center space-x-3 bg-card/60 backdrop-blur-sm rounded-full px-3 py-2 shadow-sm">
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path === "/chat" && location.pathname.startsWith("/chat"));
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center gap-3 px-5 py-2.5 rounded-full text-sm font-extrabold transition-transform duration-200 transform ${
                    isActive
                      ? "bg-gradient-to-r from-primary/30 to-accent/20 text-primary shadow-lg ring-1 ring-primary/10"
                      : "text-foreground/90 hover:bg-muted/40 hover:scale-105"
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="hidden lg:inline">{item.label}</span>
                  {typeof item.badge === "number" && item.badge > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs bg-destructive text-destructive-foreground">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side - compact on small screens */}
          <div className="flex items-center space-x-3">
              <div className="md:hidden flex items-center space-x-2">
              {navItems.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path === "/chat" && location.pathname.startsWith("/chat"));
                const Icon = item.icon;
                return (
                  <Link key={item.path} to={item.path} className={`p-3 rounded-lg ${isActive ? 'bg-primary/10 text-primary scale-105 shadow-sm' : 'hover:bg-muted/30 hover:scale-105'}`}>
                    <Icon className="w-6 h-6" />
                  </Link>
                );
              })}
            </div>

            {/* Divider */}
            <div className="hidden md:block h-8 w-px bg-border/60" />

            {/* User Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 bg-card/70 backdrop-blur px-3 py-1 rounded-full hover:shadow-md focus:outline-none"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary font-medium text-sm">{user?.name?.charAt(0).toUpperCase() || "U"}</span>
                  )}
                </div>
                <div className="hidden lg:flex flex-col leading-none">
                  <span className="text-sm font-medium">{user?.name}</span>
                  <span className="text-xs text-muted-foreground">{user?.email}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-lg z-50">
                  <div className="px-3 py-2 text-sm font-normal">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                        {user?.profileImage ? (
                          <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-primary font-medium">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{user?.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                      </div>
                    </div>
                  </div>
                  <div className="my-1 h-px bg-muted" />
                  <Link to="/profile" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted/30">
                    <User2 className="w-4 h-4" />
                    <span className="text-sm">Profile Settings</span>
                  </Link>
                  <button onClick={() => { handleLogout(); setIsDropdownOpen(false); }} className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-md text-destructive hover:bg-muted/30">
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Log out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
