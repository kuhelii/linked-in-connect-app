import { useState } from "react";
import { useParams } from "react-router-dom";
import { ChatSidebar } from "../components/ChatSidebar";
import { ChatWindow } from "../components/ChatWindow";
import { useChat, useChats } from "../hooks/useChat";
import { getCurrentUser } from "../utils/auth";

export const ChatPage = () => {
  const { chatId } = useParams();
  const [selectedChatId, setSelectedChatId] = useState(chatId || "");
  const { data: chatsData } = useChats();
  const { onlineUsers, typingUsers } = useChat();
  const currentUser = getCurrentUser();

  const selectedChat = chatsData?.chats.find(
    (chat) => chat._id === selectedChatId
  );

  return (
    <div className=" flex -my-8 h-[calc(100vh-4rem)]">
      <ChatSidebar
        selectedChatId={selectedChatId}
        onChatSelect={setSelectedChatId}
        onlineUsers={onlineUsers}
      />

      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <ChatWindow
            chat={selectedChat}
            currentUserId={currentUser?.userId || ""}
            typingUsers={typingUsers}
            onlineUsers={onlineUsers}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/20">
            <div className="text-center">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-12 h-12 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-2.697-.413l-2.725.725.725-2.725A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Welcome to Messages
              </h3>
              <p className="text-muted-foreground">
                Select a conversation to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
