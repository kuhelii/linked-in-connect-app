"use client";

import { useState, useRef, useEffect } from "react";
import {
  useChatMessages,
  useSendMessage,
  useUploadMedia,
} from "../hooks/useChat";
import type { Chat, TypingUser } from "../services/chatService";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { MessageInput } from "./MessageInput";

interface ChatWindowProps {
  chat: Chat;
  currentUserId: string;
  typingUsers: Map<string, TypingUser>;
  onlineUsers: Set<string>;
}

export const ChatWindow = ({
  chat,
  currentUserId,
  typingUsers,
  onlineUsers,
}: ChatWindowProps) => {
  const { data: messagesData, isLoading } = useChatMessages(chat._id);
  const { sendMessage } = useSendMessage();
  const uploadMediaMutation = useUploadMedia();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [replyTo, setReplyTo] = useState<any>(null);

  const otherParticipant = chat.participants.find(
    (p) => p._id !== currentUserId
  );
  const isOnline = otherParticipant && onlineUsers.has(otherParticipant._id);

  const chatTypingUsers = Array.from(typingUsers.values()).filter(
    (typing) => typing.chatId === chat._id && typing.userId !== currentUserId
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesData?.messages]);

  const handleSendMessage = async (content: string, file?: File) => {
    if (file) {
      try {
        const { mediaUrl, mediaMetadata } =
          await uploadMediaMutation.mutateAsync({
            chatId: chat._id,
            file,
          });

        sendMessage({
          chatId: chat._id,
          content: content || file.name,
          messageType: file.type.startsWith("image/")
            ? "image"
            : file.type.startsWith("video/")
            ? "video"
            : file.type.startsWith("audio/")
            ? "audio"
            : "file",
          mediaUrl,
          mediaMetadata,
          replyTo: replyTo?._id,
        });
      } catch (error) {
        console.error("Error uploading media:", error);
      }
    } else if (content.trim()) {
      sendMessage({
        chatId: chat._id,
        content,
        messageType: "text",
        replyTo: replyTo?._id,
      });
    }

    setReplyTo(null);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-muted animate-pulse rounded-full"></div>
            <div>
              <div className="h-4 bg-muted animate-pulse rounded w-32 mb-1"></div>
              <div className="h-3 bg-muted animate-pulse rounded w-20"></div>
            </div>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`flex ${
                i % 2 === 0 ? "justify-end" : "justify-start"
              }`}
            >
              <div className="h-10 bg-muted animate-pulse rounded-2xl w-48"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-border bg-background">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src={
                otherParticipant?.profileImage ||
                "/placeholder.svg?height=40&width=40"
              }
              alt={otherParticipant?.name || "User"}
              className="w-10 h-10 rounded-full object-cover"
            />
            {isOnline && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
            )}
          </div>
          <div>
            <h3 className="font-semibold">
              {otherParticipant?.isAnonymous
                ? "Anonymous User"
                : otherParticipant?.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isOnline ? "Online" : "Last seen recently"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messagesData?.messages.map((message) => (
          <MessageBubble
            key={message._id}
            message={message}
            isOwn={message.sender._id === currentUserId}
            onReply={() => setReplyTo(message)}
          />
        ))}

        {/* Typing Indicator */}
        {chatTypingUsers.length > 0 && (
          <TypingIndicator users={chatTypingUsers} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      {replyTo && (
        <div className="px-4 py-2 bg-muted border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium">
                Replying to {replyTo.sender.name}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {replyTo.content}
              </p>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="p-1 hover:bg-background rounded"
            >
              <svg
                className="w-4 h-4"
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
      )}

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        chatId={chat._id}
        isUploading={uploadMediaMutation.isLoading}
      />
    </div>
  );
};
