import { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  Send,
  Search,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  X,
  Loader2,
  FileText,
} from "lucide-react";
import { chatAPI } from "../../services/api";

export default function PoliceChat() {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChats();
    const interval = setInterval(loadChats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id);
      const interval = setInterval(() => loadMessages(selectedChat.id), 10000);
      return () => clearInterval(interval);
    }
  }, [selectedChat?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChats = async () => {
    try {
      const response = await chatAPI.getAll();
      setChats(response.data || []);
    } catch (error) {
      console.error("Failed to load chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId) => {
    try {
      const response = await chatAPI.getMessages(chatId);
      setMessages(response.data || []);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      setSending(true);
      await chatAPI.send(selectedChat.id, newMessage.trim());
      setNewMessage("");
      loadMessages(selectedChat.id);
      loadChats(); // Refresh chat list to update last message
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const closeChat = async (chatId) => {
    try {
      await chatAPI.close(chatId);
      loadChats();
      if (selectedChat?.id === chatId) {
        setSelectedChat(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Failed to close chat:", error);
    }
  };

  const filteredChats = chats.filter(
    (chat) =>
      chat.reportId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.citizenName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-white">Loading chats...</span>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex">
      {/* Chat List Sidebar */}
      <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageCircle size={24} />
            Citizen Chats
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {chats.filter((c) => c.status === "active").length} active conversations
          </p>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-700">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              <MessageCircle size={48} className="mx-auto mb-3 opacity-50" />
              <p>No chats found</p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`p-4 border-b border-slate-700 cursor-pointer hover:bg-slate-700/50 transition-colors ${
                  selectedChat?.id === chat.id ? "bg-slate-700" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <User size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {chat.citizenName || "Citizen"}
                      </p>
                      <p className="text-slate-400 text-xs truncate">
                        {chat.reportCategory || "Report"} - {chat.referenceNumber || chat.reportId?.slice(-8)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-slate-500">
                      {formatTime(chat.lastMessageTime)}
                    </span>
                    {chat.unreadCount > 0 && (
                      <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-slate-400 text-sm mt-2 truncate">
                  {chat.lastMessage || "No messages yet"}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      chat.status === "active"
                        ? "bg-green-600/20 text-green-400"
                        : "bg-slate-600/20 text-slate-400"
                    }`}
                  >
                    {chat.status || "active"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-900">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <User size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-medium">
                    {selectedChat.citizenName || "Citizen"}
                  </h3>
                  <p className="text-slate-400 text-sm flex items-center gap-2">
                    <FileText size={14} />
                    {selectedChat.referenceNumber || selectedChat.reportId?.slice(-8)}
                    {selectedChat.reportCategory && `  ${selectedChat.reportCategory}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedChat.status === "active" && (
                  <button
                    onClick={() => closeChat(selectedChat.id)}
                    className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm flex items-center gap-1"
                  >
                    <X size={16} />
                    Close Chat
                  </button>
                )}
                <span
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    selectedChat.status === "active"
                      ? "bg-green-600/20 text-green-400"
                      : "bg-slate-600/20 text-slate-400"
                  }`}
                >
                  {selectedChat.status === "active" ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle size={14} /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Clock size={14} /> Closed
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-slate-400 py-10">
                  <MessageCircle size={48} className="mx-auto mb-3 opacity-50" />
                  <p>No messages yet</p>
                  <p className="text-sm">Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${
                      msg.senderRole === "police" || msg.senderId === "police"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.senderRole === "police" || msg.senderId === "police"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-white"
                      }`}
                    >
                      {msg.senderRole !== "police" && msg.senderId !== "police" && (
                        <p className="text-xs text-slate-400 mb-1">
                          {msg.senderName || "Citizen"}
                        </p>
                      )}
                      <p>{msg.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.senderRole === "police" || msg.senderId === "police"
                            ? "text-blue-200"
                            : "text-slate-400"
                        }`}
                      >
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            {selectedChat.status === "active" ? (
              <div className="p-4 bg-slate-800 border-t border-slate-700">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder="Type your response..."
                    className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={sending}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg font-medium flex items-center gap-2"
                  >
                    {sending ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Send size={20} />
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-800 border-t border-slate-700 text-center">
                <p className="text-slate-400">
                  <AlertCircle size={18} className="inline mr-2" />
                  This chat has been closed
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-slate-400">
              <MessageCircle size={64} className="mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-medium text-white mb-2">
                Select a conversation
              </h3>
              <p>Choose a chat from the list to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
