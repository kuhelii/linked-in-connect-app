"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { chatService } from "../services/chatService"

interface MessageInputProps {
  onSendMessage: (content: string, file?: File) => void
  chatId: string
  isUploading: boolean
}

export const MessageInput = ({ onSendMessage, chatId, isUploading }: MessageInputProps) => {
  const [message, setMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  const handleTyping = useCallback(
    (typing: boolean) => {
      if (typing !== isTyping) {
        setIsTyping(typing)
        chatService.sendTyping(chatId, typing)
      }

      if (typing) {
        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
        }

        // Set new timeout to stop typing indicator
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false)
          chatService.sendTyping(chatId, false)
        }, 2000)
      }
    },
    [chatId, isTyping],
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    handleTyping(e.target.value.length > 0)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() || isUploading) {
      onSendMessage(message.trim())
      setMessage("")
      handleTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onSendMessage("", file)
      e.target.value = "" // Reset file input
    }
  }

  return (
    <div className="p-4 border-t border-border bg-background">
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        {/* Media upload button */}
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full transition-colors"
            title="Attach file"
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          />
        </div>

        {/* Message input */}
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="chat-input min-h-[44px] max-h-32"
            rows={1}
            disabled={isUploading}
          />
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={!message.trim() && !isUploading}
          className="p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  )
}
