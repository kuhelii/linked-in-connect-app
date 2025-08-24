"use client";

import { useState, useCallback, useRef } from "react";
import {
  authenticateAgent,
  runAgentCommand,
  type RunRequest,
} from "../services/smartSeekApi";
import { getCurrentUser } from "../utils/auth";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  profiles?: ProfileResult[];
  users?: UserResult[];
}

export interface ProfileResult {
  name: string;
  headline: string;
  link: string;
  position: string;
  thumbnail: string;
}

export interface UserResult {
  _id: string;
  name: string;
  headline: string;
  profileImage: string;
  location: string;
  distance: number;
  lastVisit: string;
  isAnonymous: boolean;
}

export const useSmartSeek = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const sessionIdRef = useRef<string>(
    `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  );

  const authenticateSession = useCallback(async () => {
    try {
      const user = getCurrentUser();
      if (!user) throw new Error("User not authenticated");

      // Use normalized id returned by getCurrentUser
      const userId = user.userId;
      if (!userId) throw new Error("Missing user id");

      await authenticateAgent("searchagent", userId, sessionIdRef.current);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("SmartSeek authentication failed:", error);
      throw error;
    }
  }, []);

  const parseAgentResponse = (
    response: any
  ): { content: string; profiles?: ProfileResult[]; users?: UserResult[] } => {
    try {
      // Handle different response formats
      if (Array.isArray(response)) {
        const lastMessage = response[response.length - 1];
        if (lastMessage?.content?.parts) {
          const parts = lastMessage.content.parts;
          let content = "";
          let profiles: ProfileResult[] = [];
          let users: UserResult[] = [];

          for (const part of parts) {
            if (part.text) {
              content += part.text;

              // Try to extract structured data from JSON in text
              try {
                const jsonMatch = part.text.match(/```json\n([\s\S]*?)\n```/);
                if (jsonMatch) {
                  const jsonData = JSON.parse(jsonMatch[1]);

                  // Handle search_people_response
                  if (jsonData.search_people_response?.data?.profiles) {
                    profiles = jsonData.search_people_response.data.profiles;
                  }

                  // Handle search_nearby_users_response
                  if (
                    jsonData.search_nearby_users_response?.result?.[0]?.data
                      ?.users
                  ) {
                    users =
                      jsonData.search_nearby_users_response.result[0].data
                        .users;
                  }
                }
              } catch (e) {
                // Ignore JSON parsing errors
              }
            }

            // Handle function responses
            if (part.functionResponse) {
              const funcResponse = part.functionResponse.response;
              if (funcResponse?.data?.profiles) {
                profiles = funcResponse.data.profiles;
              }
              if (funcResponse?.result?.[0]?.data?.users) {
                users = funcResponse.result[0].data.users;
              }
            }
          }

          return {
            content,
            profiles: profiles.length > 0 ? profiles : undefined,
            users: users.length > 0 ? users : undefined,
          };
        }
      }

      return {
        content:
          "I received your message but couldn't process the response properly.",
      };
    } catch (error) {
      console.error("Error parsing agent response:", error);
      return {
        content: "Sorry, I encountered an error processing the response.",
      };
    }
  };

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      const user = getCurrentUser();
      if (!user) throw new Error("User not authenticated");

      // Add user message
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        role: "user",
        content: message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        // Authenticate if not already done
        if (!isAuthenticated) {
          await authenticateSession();
        }

        // Send message to agent
        const userId = user.userId;
        if (!userId) throw new Error("Missing user id");
        const runPayload: RunRequest = {
          appName: "searchagent",
          userId,
          sessionId: sessionIdRef.current,
          newMessage: {
            role: "user",
            parts: [{ text: message }],
          },
        };

        const result = await runAgentCommand(runPayload);
        const { content, profiles, users } = parseAgentResponse(result.result);

        // Add assistant response
        const assistantMessage: ChatMessage = {
          id: `assistant_${Date.now()}`,
          role: "assistant",
          content,
          timestamp: new Date(),
          profiles,
          users,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error("SmartSeek error:", error);
        const errorMessage: ChatMessage = {
          id: `error_${Date.now()}`,
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, authenticateSession]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setIsAuthenticated(false);
    sessionIdRef.current = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat,
  };
};
