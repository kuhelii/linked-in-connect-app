"use client";

import { useState } from "react";
import { useChats, useCreatePrivateChat } from "../hooks/useChat";
import { useFriends } from "../hooks/useFriends";
import { getCurrentUser } from "../utils/auth";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

interface ChatSidebarProps {
  selectedChatId?: string;
  onChatSelect: (chatId: string) => void;
  onlineUsers: Set<string>;
}

export const ChatSidebar = ({
  selectedChatId,
  onChatSelect,
  onlineUsers,
}: ChatSidebarProps) => {
  const { data: chatsData, isLoading } = useChats();
  const { data: friendsData } = useFriends();
  const createChatMutation = useCreatePrivateChat();
  const currentUser = getCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [showStartChatModal, setShowStartChatModal] = useState(false);

  const filteredChats = chatsData?.chats.filter((chat) =>
    chat.participants.some((participant) =>
      participant.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleStartChat = async (friendId: string) => {
    try {
      const result = await createChatMutation.mutateAsync(friendId);
      onChatSelect(result.chat._id);
      setShowStartChatModal(false);
      toast.success("Chat started successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to start chat");
    }
  };

  if (isLoading) {
    return (
      <div className="chat-sidebar w-80 h-full flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="h-10 bg-muted animate-pulse rounded-lg"></div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border-b border-border">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-muted animate-pulse rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted animate-pulse rounded mb-2"></div>
                  <div className="h-3 bg-muted animate-pulse rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="chat-sidebar w-80 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Messages</h2>
          <button
            onClick={() => setShowStartChatModal(true)}
            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
            title="Start new chat"
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
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </button>
        </div>
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field"
        />
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats?.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8"
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
            </div>
            <p className="mb-2">No conversations yet</p>
            <p className="text-sm mb-4">Start chatting with your friends!</p>
            <button
              onClick={() => setShowStartChatModal(true)}
              className="btn-primary"
            >
              Start New Chat
            </button>
          </div>
        ) : (
          filteredChats?.map((chat) => {
            const otherParticipant = chat.participants.find(
              (p) => p._id !== currentUser?.userId
            );
            const isOnline =
              otherParticipant && onlineUsers.has(otherParticipant._id);
            const isSelected = chat._id === selectedChatId;

            return (
              <div
                key={chat._id}
                className={`chat-item ${isSelected ? "chat-item-active" : ""}`}
                onClick={() => onChatSelect(chat._id)}
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="relative">
                    <img
                      src={
                        otherParticipant?.profileImage ||
                        "/placeholder.svg?height=48&width=48"
                      }
                      alt={otherParticipant?.name || "User"}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                    )}
                  </div>

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium truncate">
                        {otherParticipant?.name || "Unknown User"}
                      </h3>
                      {chat.lastMessage && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(
                            new Date(chat.lastMessage.createdAt),
                            { addSuffix: true }
                          )}
                        </span>
                      )}
                    </div>
                    {chat.lastMessage && (
                      <p className="text-sm text-muted-foreground truncate">
                        {chat.lastMessage.messageType === "text"
                          ? chat.lastMessage.content
                          : `📎 ${chat.lastMessage.messageType}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Start Chat Modal */}
      {showStartChatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Start New Chat</h3>
                <button
                  onClick={() => setShowStartChatModal(false)}
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

            <div className="p-4 max-h-96 overflow-y-auto">
              {friendsData?.friends?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No friends available</p>
                  <p className="text-sm mt-1">
                    Add some friends to start chatting!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {friendsData?.friends?.map((friend: any) => {
                    // Check if chat already exists with this friend
                    const existingChat = chatsData?.chats.find((chat) =>
                      chat.participants.some((p) => p._id === friend._id)
                    );

                    return (
                      <div
                        key={friend._id}
                        className="flex items-center space-x-3 p-3 hover:bg-accent rounded-lg cursor-pointer"
                        onClick={() => {
                          console.log(friend);
                          if (existingChat) {
                            onChatSelect(existingChat._id);
                            setShowStartChatModal(false);
                          } else {
                            handleStartChat(friend.id);
                          }
                        }}
                      >
                        <img
                          src={
                            friend.profileImage ||
                            "/placeholder.svg?height=40&width=40"
                          }
                          alt={friend.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{friend.name}</h4>
                            {onlineUsers.has(friend._id) && (
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                          </div>
                          {existingChat && (
                            <p className="text-xs text-muted-foreground">
                              Chat exists
                            </p>
                          )}
                        </div>
                        {existingChat ? (
                          <svg
                            className="w-4 h-4 text-muted-foreground"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-4 h-4 text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
