"use client"

import type { TypingUser } from "../services/chatService"

interface TypingIndicatorProps {
  users: TypingUser[]
}

export const TypingIndicator = ({ users }: TypingIndicatorProps) => {
  if (users.length === 0) return null

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0].userName} is typing...`
    } else if (users.length === 2) {
      return `${users[0].userName} and ${users[1].userName} are typing...`
    } else {
      return `${users[0].userName} and ${users.length - 1} others are typing...`
    }
  }

  return (
    <div className="flex items-center space-x-3 px-4 py-2">
      <div className="typing-indicator">
        <div className="typing-dot" style={{ animationDelay: "0ms" }}></div>
        <div className="typing-dot" style={{ animationDelay: "150ms" }}></div>
        <div className="typing-dot" style={{ animationDelay: "300ms" }}></div>
      </div>
      <span className="text-sm text-muted-foreground">{getTypingText()}</span>
    </div>
  )
}
