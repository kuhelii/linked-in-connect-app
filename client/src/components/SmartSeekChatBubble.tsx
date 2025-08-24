import type React from "react";
import { Bot, User } from "lucide-react";
import type { ChatMessage } from "../hooks/useSmartSeek";
import { SmartSeekProfileCard } from "./SmartSeekProfileCard";

interface SmartSeekChatBubbleProps {
  message: ChatMessage;
}

export const SmartSeekChatBubble: React.FC<SmartSeekChatBubbleProps> = ({
  message,
}) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`flex max-w-[80%] ${
          isUser ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? "bg-primary ml-2" : "bg-accent mr-2"
          }`}
        >
          {isUser ? (
            <User className="w-4 h-4 text-primary-foreground" />
          ) : (
            <Bot className="w-4 h-4 text-accent-foreground" />
          )}
        </div>
        <div
          className={`rounded-lg px-4 py-2 ${
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-card text-card-foreground border border-border"
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>

          {/* Display profiles if present */}
          {message.profiles && message.profiles.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-medium opacity-75">Found Profiles:</p>
              <div className="grid gap-2">
                {message.profiles.map((profile, index) => (
                  <SmartSeekProfileCard key={index} profile={profile} />
                ))}
              </div>
            </div>
          )}

          {/* Display users if present */}
          {message.users && message.users.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-medium opacity-75">Nearby Users:</p>
              <div className="grid gap-2">
                {message.users.map((user, index) => (
                  <SmartSeekProfileCard key={index} user={user} />
                ))}
              </div>
            </div>
          )}

          <p className="text-xs opacity-50 mt-2">
            {message.timestamp.toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
};
