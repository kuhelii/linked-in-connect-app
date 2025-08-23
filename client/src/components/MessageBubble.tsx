"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import type { Message } from "../services/chatService"

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  onReply: () => void
}

export const MessageBubble = ({ message, isOwn, onReply }: MessageBubbleProps) => {
  const [showActions, setShowActions] = useState(false)

  const renderMessageContent = () => {
    switch (message.messageType) {
      case "image":
        return (
          <div className="space-y-2">
            {message.content && <p>{message.content}</p>}
            <img
              src={message.mediaUrl || "/placeholder.svg"}
              alt="Shared image"
              className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(message.mediaUrl, "_blank")}
            />
          </div>
        );
      case "video":
        return (
          <div className="space-y-2">
            {message.content && <p>{message.content}</p>}
            <video src={message.mediaUrl} controls className="max-w-xs rounded-lg" style={{ maxHeight: "300px" }} />
          </div>
        );
      case "audio":
        return (
          <div className="space-y-2">
            {message.content && <p>{message.content}</p>}
            <audio src={message.mediaUrl} controls className="w-full max-w-xs" />
          </div>
        );
      case "file":
        return (
          <div className="flex items-center space-x-3 p-3 bg-background/50 rounded-lg">
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate"></p>
              {/* Optionally display file size here if needed */}
            </div>
            <a
              href={message.mediaUrl}
              download={message.mediaMetadata?.fileName}
              className="p-2 hover:bg-background rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </a>
          </div>
        );
      default:
        return <p className="whitespace-pre-wrap break-words">{message.content}</p>;
    }
  };

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} group`}>
      <div
        className={`relative max-w-xs lg:max-w-md`}
        style={
          isOwn
            ? {
                background:
                  "linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)",
                color: "#fff",
                borderRadius: "0.75rem 0.75rem 0.25rem 0.75rem",
                boxShadow:
                  "0 2px 12px 0 rgba(99,102,241,0.10), 0 1px 4px 0 rgba(0,0,0,0.04)",
                border: "1px solid #a78bfa33",
                padding: "0.5rem 0.75rem",
                marginBottom: "0.35rem",
              }
            : {
                background:
                  "linear-gradient(135deg, #e0f7fa 0%, #b2f7ef 100%)",
                color: "#186f65",
                borderRadius: "0.75rem 0.75rem 0.75rem 0.25rem",
                boxShadow:
                  "0 2px 12px 0 rgba(156,163,175,0.10), 0 1px 4px 0 rgba(0,0,0,0.04)",
                border: "1px solid #b2f7ef",
                padding: "0.5rem 0.75rem",
                marginBottom: "0.35rem",
              }
        }
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Reply indicator */}
        {message.replyTo && (
          <div
            className="mb-2 p-2 rounded-lg border-l-4"
            style={{
              background: isOwn ? "#a78bfa22" : "#f3f4f688",
              borderColor: isOwn ? "#6366f1" : "#a1a1aa",
              color: isOwn ? "#fff" : "#22223b",
            }}
          >
            <p className="text-xs font-medium opacity-75">
              {message.replyTo?.sender === message.sender._id ? "You" : "Replying to"}
            </p>
            <p className="text-sm opacity-75 truncate">
              {message.replyTo?.messageType === "text" ? message.replyTo?.content : `📎 ${message.replyTo?.messageType}`}
            </p>
          </div>
        )}

        {/* Message content */}
        <div style={{ wordBreak: "break-word" }}>{renderMessageContent()}</div>

        {/* Message info */}
        <div className="flex items-center justify-end space-x-1 mt-1">
          {message.editedAt && <span className="text-xs opacity-50">edited</span>}
          <span className="text-xs opacity-50">
            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
          </span>
          {isOwn && (
            <div className="flex space-x-1">
              {message.readBy && message.readBy.length > 1 ? (
                // Double-thick check for seen (like WhatsApp)
                <span className="flex items-center">
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <svg className="w-4 h-4 -ml-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              ) : (
                // Single-thick check for delivered
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          )}
        </div>

        {/* Message actions */}
        {showActions && (
          <div
            className={`absolute top-0 ${
              isOwn ? "-left-20" : "-right-20"
            } flex space-x-1 bg-popover border border-border rounded-lg p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity`}
          >
            <button onClick={onReply} className="p-2 hover:bg-accent rounded-md transition-colors" title="Reply">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                />
              </svg>
            </button>
            {isOwn && message.messageType === "text" && (
              <button className="p-2 hover:bg-accent rounded-md transition-colors" title="Edit">
                {/* ...edit icon... */}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
