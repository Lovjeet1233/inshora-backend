"use client";

import { useState, useEffect, useRef } from "react";
import { useWhatsApp } from "@/hooks/useWhatsApp";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Send, MessageCircle, Search, Bot } from "lucide-react";
import { formatTime, formatPhoneNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Conversation } from "@/types";

export default function WhatsAppPage() {
  const { conversations, isLoading, sendMessage, isSending } = useWhatsApp();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConversation]);

  const handleSendMessage = () => {
    if (!message.trim() || !selectedConversation) return;

    const phoneNumber = selectedConversation.threadId.replace("whatsapp_", "");
    sendMessage({
      to: phoneNumber,
      message,
      threadId: selectedConversation.threadId,
    });
    setMessage("");
  };

  const filteredConversations = conversations?.filter((conv) =>
    conv.threadId.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">WhatsApp Chat</h1>
        <p className="text-muted-foreground">
          Manage your WhatsApp conversations with AI assistance
        </p>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-12rem)]">
        {/* Conversations List */}
        <Card className="col-span-12 md:col-span-4 flex flex-col">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredConversations && filteredConversations.length > 0 ? (
              <div className="divide-y divide-slate-800">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.threadId}
                    onClick={() => setSelectedConversation(conv)}
                    className={cn(
                      "w-full p-4 text-left hover:bg-slate-800/50 transition-colors",
                      selectedConversation?.threadId === conv.threadId && "bg-slate-800"
                    )}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                          <MessageCircle className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">
                            {formatPhoneNumber(conv.threadId.replace("whatsapp_", ""))}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {conv.lastMessage.message}
                          </p>
                        </div>
                      </div>
                      {conv.unreadCount > 0 && (
                        <Badge variant="default" className="ml-2">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(conv.lastMessage.timestamp)}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <MessageCircle className="w-12 h-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No conversations yet</p>
              </div>
            )}
          </div>
        </Card>

        {/* Chat Area */}
        <Card className="col-span-12 md:col-span-8 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {formatPhoneNumber(selectedConversation.threadId.replace("whatsapp_", ""))}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedConversation.messages.length} messages
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedConversation.messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={cn(
                      "flex",
                      msg.direction === "outbound" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[70%] rounded-lg p-3",
                        msg.direction === "outbound"
                          ? "bg-primary text-primary-foreground"
                          : "bg-slate-800 text-white"
                      )}
                    >
                      {msg.direction === "inbound" && (
                        <div className="flex items-center gap-1 mb-1">
                          <Bot className="w-3 h-3 text-purple-400" />
                          <span className="text-xs text-purple-400">AI Response</span>
                        </div>
                      )}
                      <p className="text-sm">{msg.message}</p>
                      <p
                        className={cn(
                          "text-xs mt-1",
                          msg.direction === "outbound"
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        )}
                      >
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    disabled={isSending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isSending || !message.trim()}
                  >
                    {isSending ? (
                      <LoadingSpinner size={16} />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">
                Choose a conversation from the list to view messages
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
