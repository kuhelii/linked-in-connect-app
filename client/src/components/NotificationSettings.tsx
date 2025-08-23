"use client";

import { useState, useEffect } from "react";
import { notificationService } from "../services/notificationService";
import toast from "react-hot-toast";

export const NotificationSettings = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    setPermission(Notification.permission);
    const subscribed = await notificationService.isSubscribed();
    setIsSubscribed(subscribed);
  };

  const handleToggleNotifications = async () => {
    setIsLoading(true);
    try {
      if (isSubscribed) {
        const success = await notificationService.unsubscribeFromPush();
        if (success) {
          setIsSubscribed(false);
          toast.success("Push notifications disabled");
        } else {
          toast.error("Failed to disable notifications");
        }
      } else {
        const success = await notificationService.subscribeToPush();
        if (success) {
          setIsSubscribed(true);
          toast.success("Push notifications enabled");
        } else {
          toast.error("Failed to enable notifications");
        }
      }
    } catch (error) {
      toast.error("Error updating notification settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `${(import.meta as any).env.VITE_API_URL}/api/notifications/test`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Test notification sent");
      } else {
        toast.error("Failed to send test notification");
      }
    } catch (error) {
      toast.error("Error sending test notification");
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>

      <div className="space-y-4">
        {/* Push Notifications Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Push Notifications</h4>
            <p className="text-sm text-muted-foreground">
              Receive notifications for new messages and friend requests
            </p>
          </div>
          <button
            onClick={handleToggleNotifications}
            disabled={isLoading || permission === "denied"}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isSubscribed ? "bg-primary" : "bg-muted"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isSubscribed ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Permission Status */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Permission Status</h4>
            <p className="text-sm text-muted-foreground">
              Current browser notification permission
            </p>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              permission === "granted"
                ? "bg-green-100 text-green-800"
                : permission === "denied"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {permission.charAt(0).toUpperCase() + permission.slice(1)}
          </span>
        </div>

        {/* Test Notification */}
        {isSubscribed && (
          <div className="pt-4 border-t border-border">
            <button onClick={handleTestNotification} className="btn-outline">
              Send Test Notification
            </button>
          </div>
        )}

        {/* Help Text */}
        {permission === "denied" && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Notifications are blocked. Please enable them in your browser
              settings to receive push notifications.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
