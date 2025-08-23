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
    <div
      className="p-4 border-t border-border bg-background/80 backdrop-blur-lg shadow-lg rounded-b-2xl"
      style={{
        boxShadow:
          "0 4px 24px 0 rgba(0,0,0,0.08), 0 1.5px 6px 0 rgba(0,0,0,0.04)",
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-4"
      >
        {/* Media upload button */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-2 bg-gradient-to-tr from-primary/20 to-accent/20 text-primary hover:bg-primary/30 rounded-xl shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
            title="Attach file"
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className="chat-input min-h-[44px] max-h-32 px-4 py-2 rounded-xl border border-border bg-white/80 shadow-inner focus:outline-none focus:ring-2 focus:ring-primary text-base transition-all duration-200"
            rows={1}
            disabled={isUploading}
            style={{ resize: "none" }}
          />
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={!message.trim() && !isUploading}
          className="p-3 bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 text-white rounded-full shadow-xl hover:scale-110 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-pink-400/40 transition-all duration-200 flex items-center justify-center relative disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            boxShadow:
              "0 0 12px 2px rgba(236,72,153,0.25), 0 2px 8px 0 rgba(59,130,246,0.12)",
          }}
        >
          <span className="absolute inset-0 rounded-full pointer-events-none animate-pulse bg-pink-500/10" />
          <svg className="w-7 h-7 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
}
