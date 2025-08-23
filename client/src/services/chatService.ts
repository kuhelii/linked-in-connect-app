import { io, type Socket } from "socket.io-client";
import api from "./api";

export interface Message {
  _id: string;
  chatId: string;
  sender: {
    _id: string;
    name: string;
    profileImage?: string;
  };
  content: string;
  messageType: "text" | "image" | "video" | "file" | "audio";
  mediaUrl?: string;
  mediaMetadata?: {
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    duration?: number;
  };
  readBy: Array<{
    user: string;
    readAt: string;
  }>;
  replyTo?: {
    _id: string;
    content: string;
    sender: string;
    messageType: string;
  };
  editedAt?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Chat {
  _id: string;
  participants: Array<{
    _id: string;
    name: string;
    profileImage?: string;
    isAnonymous: boolean;
  }>;
  chatType: "private" | "group";
  name?: string;
  description?: string;
  avatar?: string;
  lastMessage?: Message;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TypingUser {
  userId: string;
  userName: string;
  chatId: string;
  isTyping: boolean;
}

class ChatService {
  private socket: Socket | null = null;

  connect(token: string) {
    this.socket = io(
      (import.meta as any).env.VITE_API_URL || "http://localhost:5000",
      {
        auth: { token },
      }
    );

    this.socket.on("connect", () => {
      console.log("Connected to chat server");
      this.socket?.emit("join-chats");
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from chat server");
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  // API calls
  async getChats(
    page = 1,
    limit = 20
  ): Promise<{ chats: Chat[]; hasMore: boolean }> {
    try {
      const response = await api.get(`/chat?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch chats:", error);
      throw new Error("Failed to fetch chats");
    }
  }

  async createPrivateChat(participantId: string): Promise<{ chat: Chat }> {
    try {
      console.log("Creating private chat with participantId:", participantId);
      const response = await api.post("/chat/private", { participantId });
      return response.data;
    } catch (error) {
      console.error("Failed to create chat:", error);
      throw new Error("Failed to create chat");
    }
  }

  async getChatMessages(
    chatId: string,
    page = 1,
    limit = 50
  ): Promise<{ messages: Message[]; hasMore: boolean }> {
    try {
      const response = await api.get(
        `/chat/${chatId}/messages?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      throw new Error("Failed to fetch messages");
    }
  }

  async uploadMedia(
    chatId: string,
    file: File
  ): Promise<{ mediaUrl: string; mediaMetadata: any }> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post(`/chat/${chatId}/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Failed to upload media:", error);
      throw new Error("Failed to upload media");
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      await api.delete(`/chat/messages/${messageId}`);
    } catch (error) {
      console.error("Failed to delete message:", error);
      throw new Error("Failed to delete message");
    }
  }

  async editMessage(
    messageId: string,
    content: string
  ): Promise<{ message: Message }> {
    try {
      const response = await api.put(`/chat/messages/${messageId}`, {
        content,
      });
      return response.data;
    } catch (error) {
      console.error("Failed to edit message:", error);
      throw new Error("Failed to edit message");
    }
  }

  // Socket events
  sendMessage(data: {
    chatId: string;
    content: string;
    messageType?: string;
    mediaUrl?: string;
    mediaMetadata?: any;
    replyTo?: string;
  }) {
    this.socket?.emit("send-message", data);
  }

  sendTyping(chatId: string, isTyping: boolean) {
    this.socket?.emit("typing", { chatId, isTyping });
  }

  markMessagesRead(chatId: string, messageIds: string[]) {
    this.socket?.emit("mark-messages-read", { chatId, messageIds });
  }
}

export const chatService = new ChatService();
