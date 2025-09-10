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
  lastVisit: string | null;
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
      // Handle empty or non-array response
      if (!Array.isArray(response) || response.length === 0) {
        return {
          content: "No response data available.",
        };
      }

      let content = "";
      let profiles: ProfileResult[] = [];
      let users: UserResult[] = [];

      // Case 1: Location-based search (profiles in [1].content.parts[0].functionResponse.response.data.profiles)
      if (
        response.length >= 2 &&
        response[1]?.content?.parts?.[0]?.functionResponse?.response?.data
          ?.profiles
      ) {
        profiles =
          response[1].content.parts[0].functionResponse.response.data.profiles;
        content = `Here are the search results for ${response[0].content.parts[0].functionCall.args.job} in ${response[0].content.parts[0].functionCall.args.location}:`;
      }
      // Case 2: Random user search (users in [1].content.parts[0].functionResponse.response.data)
      else if (
        response.length >= 2 &&
        response[1]?.content?.parts?.[0]?.functionResponse?.response?.data
      ) {
        const data =
          response[1].content.parts[0].functionResponse.response.data;
        // Handle both single user object and array of users
        users = Array.isArray(data) ? data : [data];
        content = "Here is a random user found:";
      }
      // Case 3: Nearby users search (users in [1].content.parts[0].functionResponse.response.result[0].data.users)
      else if (
        response.length >= 2 &&
        response[1]?.content?.parts?.[0]?.functionResponse?.response
          ?.result?.[0]?.data?.users
      ) {
        users =
          response[1].content.parts[0].functionResponse.response.result[0].data
            .users;
        content = "Here are the nearby users found:";
      }
      // Case 4: Normal text response (use [0].content.parts[0].text)
      else if (response[0]?.content?.parts?.[0]?.text) {
        content = response[0].content.parts[0].text;
      }
      // Fallback for unexpected structure
      else {
        content = "No valid response data found.";
      }

      return {
        content: content || "No content available.",
        profiles: profiles.length > 0 ? profiles : undefined,
        users: users.length > 0 ? users : undefined,
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

      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        role: "user",
        content: message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        if (!isAuthenticated) {
          await authenticateSession();
        }

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
        const { content, profiles, users } = parseAgentResponse(result);

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
