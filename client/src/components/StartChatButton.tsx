"use client";

import { useState } from "react";
import { useCreatePrivateChat } from "../hooks/useChat";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

interface StartChatButtonProps {
  userId: string;
  userName: string;
  className?: string;
}

export const StartChatButton = ({
  userId,
  userName,
  className = "",
}: StartChatButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const createChatMutation = useCreatePrivateChat();
  const navigate = useNavigate();

  const handleStartChat = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const result = await createChatMutation.mutateAsync(userId);
      navigate(`/chat/${result.chat._id}`);
      toast.success(`Started chat with ${userName}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to start chat");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleStartChat}
      disabled={isLoading}
      className={`btn-primary ${className} ${
        isLoading ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
      ) : (
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-2.697-.413l-2.725.725.725-2.725A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"
          />
        </svg>
      )}
      Message
    </button>
  );
};
