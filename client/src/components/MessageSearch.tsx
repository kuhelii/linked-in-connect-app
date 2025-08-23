"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "react-query";
import { formatDistanceToNow } from "date-fns";
import type { Message } from "../services/chatService";

interface MessageSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onMessageSelect: (message: Message) => void;
}

export const MessageSearch = ({
  isOpen,
  onClose,
  onMessageSelect,
}: MessageSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const { data: searchResults, isLoading } = useQuery(
    ["message-search", debouncedQuery],
    async () => {
      if (!debouncedQuery.trim()) return null;

      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `${
          (import.meta as any).env.VITE_API_URL
        }/api/chat/search?q=${encodeURIComponent(debouncedQuery)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to search messages");
      }

      return response.json();
    },
    {
      enabled: !!debouncedQuery.trim(),
      staleTime: 1000 * 60 * 2, // 2 minutes
    }
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50">
      <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <svg
              className="w-5 h-5 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-foreground placeholder-muted-foreground"
            />
            <button
              onClick={onClose}
              className="p-1 text-muted-foreground hover:text-foreground rounded"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {!searchQuery.trim() ? (
            <div className="p-8 text-center text-muted-foreground">
              <svg
                className="w-12 h-12 mx-auto mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <p>Search through your messages</p>
            </div>
          ) : isLoading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Searching...</p>
            </div>
          ) : searchResults?.messages.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>No messages found for "{searchQuery}"</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {searchResults?.messages.map((message: Message) => (
                <div
                  key={message._id}
                  className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => {
                    onMessageSelect(message);
                    onClose();
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <img
                      src={
                        message.sender.profileImage ||
                        "/placeholder.svg?height=32&width=32"
                      }
                      alt={message.sender.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm">
                          {message.sender.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(message.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground line-clamp-2">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
