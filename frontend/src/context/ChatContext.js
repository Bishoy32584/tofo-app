import React, { createContext, useState } from "react";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [conversations, setConversations] = useState([
    {
      id: "1",
      name: "Mina",
      online: true,
      starred: false,
      blocked: false,
      background: "#1e1e1e",
      messages: [
        {
          sender: "Mina",
          text: "حاسس إن الدنيا تقيلة شوية",
          timestamp: "2026-02-27T22:42:00",
          seen: true,
        },
        {
          sender: "You",
          text: "تمام، خلينا نسمعك أكتر",
          timestamp: "2026-02-27T22:45:00",
          seen: true,
        },
      ],
    },
    {
      id: "2",
      name: "Sara",
      online: false,
      starred: true,
      blocked: false,
      background: "#1e1e1e",
      messages: [
        {
          sender: "Sara",
          text: "شكراً إنك سمعتني",
          timestamp: "2026-02-27T21:15:00",
          seen: false,
        },
      ],
    },
  ]);

  const sendMessage = (id, text) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === id
          ? {
              ...conv,
              messages: [
                ...conv.messages,
                {
                  sender: "You",
                  text,
                  timestamp: new Date().toISOString(),
                  seen: false,
                },
              ],
            }
          : conv
      )
    );
  };

  const markAsRead = (id) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === id
          ? {
              ...conv,
              messages: conv.messages.map(msg => ({
                ...msg,
                seen: true,
              })),
            }
          : conv
      )
    );
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        sendMessage,
        markAsRead,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};