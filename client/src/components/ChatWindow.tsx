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
          <div className="flex items-center space-x-3" style={{ background: '#f7f8fa' }}>
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
  <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: '#f3f4f8', position: 'relative' }}>
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
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
        style={{ marginBottom: '96px', minHeight: 0, maxHeight: 'calc(100vh - 180px)' }}
      >
        {messagesData?.messages.length ? (
          messagesData.messages.map((message) => (
            <MessageBubble
              key={message._id}
              message={message}
              isOwn={message.sender._id === currentUserId}
              onReply={() => setReplyTo(message)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-2.697-.413l-2.725.725.725-2.725A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
            </svg>
            <p className="mb-2">No messages yet</p>
            <p className="text-sm mb-4">Start the conversation below!</p>
          </div>
        )}

        {/* Typing Indicator */}
        {chatTypingUsers.length > 0 && (
          <TypingIndicator users={chatTypingUsers} />
        )}

        <div ref={messagesEndRef} />
      </div>

  {/* Reply Preview */}
      {replyTo && (
        <div className="px-4 py-2 bg-muted border-t border-border" style={{ position: 'absolute', left: 0, right: 0, bottom: '96px', zIndex: 10 }}>
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
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 20, background: 'transparent' }}>
        <MessageInput
          onSendMessage={handleSendMessage}
          chatId={chat._id}
          isUploading={uploadMediaMutation.isLoading}
        />
      </div>
    </div>
  );
};
