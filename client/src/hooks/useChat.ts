"use client"

import { useState, useEffect, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "react-query"
import { chatService, type Chat, type Message, type TypingUser } from "../services/chatService"
import { getToken } from "../utils/auth"
import toast from "react-hot-toast"

export const useChat = () => {
  const [socket, setSocket] = useState<any>(null)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser>>(new Map())
  const queryClient = useQueryClient()

  useEffect(() => {
    const token = getToken()
    if (token) {
      const socketInstance = chatService.connect(token)
      setSocket(socketInstance)

      // Socket event listeners
      socketInstance.on("new-message", (message: Message) => {
        queryClient.setQueryData(["chat-messages", message.chatId], (old: any) => {
          if (!old) return { messages: [message], hasMore: false }
          return {
            ...old,
            messages: [...old.messages, message],
          }
        })

        // Update chat list with new last message
        queryClient.setQueryData(["chats"], (old: any) => {
          if (!old) return old
          return {
            ...old,
            chats: old.chats.map((chat: Chat) =>
              chat._id === message.chatId ? { ...chat, lastMessage: message, lastMessageAt: message.createdAt } : chat,
            ),
          }
        })

        // Show notification if not in current chat
        const currentPath = window.location.pathname
        if (!currentPath.includes(message.chatId)) {
          toast(`New message from ${message.sender.name}`, {
            icon: "💬",
          })
        }
      })

      socketInstance.on("user-typing", (data: TypingUser) => {
        setTypingUsers((prev) => {
          const newMap = new Map(prev)
          const key = `${data.userId}-${data.chatId}`
          if (data.isTyping) {
            newMap.set(key, data)
          } else {
            newMap.delete(key)
          }
          return newMap
        })
      })

      socketInstance.on("messages-read", (data: { userId: string; messageIds: string[]; readAt: string }) => {
        // Update read receipts in messages
        data.messageIds.forEach((messageId) => {
          queryClient.setQueryData(["chat-messages"], (old: any) => {
            if (!old) return old
            return {
              ...old,
              messages: old.messages.map((msg: Message) =>
                msg._id === messageId
                  ? {
                      ...msg,
                      readBy: [...msg.readBy, { user: data.userId, readAt: data.readAt }],
                    }
                  : msg,
              ),
            }
          })
        })
      })

      socketInstance.on("user-online", (userId: string) => {
        setOnlineUsers((prev) => new Set([...prev, userId]))
      })

      socketInstance.on("user-offline", (userId: string) => {
        setOnlineUsers((prev) => {
          const newSet = new Set(prev)
          newSet.delete(userId)
          return newSet
        })
      })

      socketInstance.on("error", (error: { message: string }) => {
        toast.error(error.message)
      })

      return () => {
        chatService.disconnect()
      }
    }
  }, [queryClient])

  return {
    socket,
    onlineUsers,
    typingUsers,
  }
}

export const useChats = () => {
  return useQuery(["chats"], () => chatService.getChats(), {
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export const useChatMessages = (chatId: string) => {
  return useQuery(["chat-messages", chatId], () => chatService.getChatMessages(chatId), {
    enabled: !!chatId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export const useCreatePrivateChat = () => {
  const queryClient = useQueryClient()

  return useMutation((participantId: string) => chatService.createPrivateChat(participantId), {
    onSuccess: () => {
      queryClient.invalidateQueries(["chats"])
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create chat")
    },
  })
}

export const useSendMessage = () => {
  const sendMessage = useCallback(
    (data: {
      chatId: string
      content: string
      messageType?: string
      mediaUrl?: string
      mediaMetadata?: any
      replyTo?: string
    }) => {
      chatService.sendMessage(data)
    },
    [],
  )

  return { sendMessage }
}

export const useUploadMedia = () => {
  return useMutation(({ chatId, file }: { chatId: string; file: File }) => chatService.uploadMedia(chatId, file), {
    onError: (error: any) => {
      toast.error(error.message || "Failed to upload media")
    },
  })
}
