"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Trash2, MessageSquare } from "lucide-react";
import { useSmartSeek } from "../hooks/useSmartSeek";
import { SmartSeekChatBubble } from "../components/SmartSeekChatBubble";

export const SmartSeekPage: React.FC = () => {
  const [inputMessage, setInputMessage] = useState("");
  const { messages, isLoading, sendMessage, clearChat } = useSmartSeek();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const message = inputMessage.trim();
    setInputMessage("");
    await sendMessage(message);
  };

  const suggestedQueries = [
    "Find software developers in New York",
    "Search for users within 100km of coordinates 24.790181, 87.922892",
    "Find designers in San Francisco",
    "Search for product managers in London",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">SmartSeek</h1>
              <p className="text-sm text-muted-foreground">
                AI-Powered People Search Assistant
              </p>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Chat</span>
          </button>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-80px)]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Welcome to SmartSeek
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                I'm your AI-powered search assistant. I can help you find people
                by location, job title, or search nearby users.
              </p>
              <div className="grid gap-2 max-w-md mx-auto">
                <p className="text-sm font-medium text-foreground mb-2">
                  Try asking:
                </p>
                {suggestedQueries.map((query, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(query)}
                    className="text-left p-3 bg-card border border-border rounded-lg hover:bg-accent/50 transition-colors text-sm"
                  >
                    "{query}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <SmartSeekChatBubble key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-accent-foreground animate-pulse" />
                    </div>
                    <div className="bg-card border border-border rounded-lg px-4 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="border-t border-border bg-card px-6 py-4">
          <form onSubmit={handleSubmit} className="flex space-x-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me to find people by location, job, or search nearby users..."
              className="flex-1 px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder-muted-foreground"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
