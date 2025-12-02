import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Send, MessageCircle, User, Shield } from "lucide-react";
import { chatAPI } from "../../services/api";
import { useAuthStore } from "../../store/authStore";

export default function CitizenChat() {
  const { reportId } = useParams();
  const { user } = useAuthStore();
  const messagesEndRef = useRef(null);

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatInfo, setChatInfo] = useState(null);

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat.id);
    }
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadChats = async () => {
    try {
      const response = await chatAPI.getAll();
      setChats(response.data || []);
      if (response.data?.length > 0) {
        setActiveChat(response.data[0]);
      }
    } catch (error) {
      console.error("Failed to load chats:", error);
    }
  };

  const loadMessages = async (chatId) => {
    try {
      const response = await chatAPI.getMessages(chatId);
      setMessages(response.data?.messages || response.data || []);
      setChatInfo({
        reportReference: response.data?.reportReference,
        reportCategory: response.data?.reportCategory,
      });
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    setLoading(true);
    try {
      const response = await chatAPI.send(activeChat.id, newMessage);
      // Add the message from response or create one
      const newMsg = response.data?.message || {
        text: newMessage,
        senderId: user?.id,
        senderName: user?.name || "You",
        senderRole: "citizen",
        timestamp: new Date().toISOString(),
      };
      setMessages([...messages, newMsg]);
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setLoading(false);
    }
  };

  const isMyMessage = (msg) => {
    return msg.senderId === user?.id || msg.senderRole === "citizen";
  };

  return (
    <div className="h-[calc(100vh-10rem)]">
      <div className="bg-slate-800 rounded-lg border border-slate-700 h-full flex overflow-hidden">
        {/* Chat List */}
        <div className="w-72 border-r border-slate-700 flex flex-col hidden sm:flex">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-lg font-bold text-white">My Conversations</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chats.length > 0 ? (
              chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setActiveChat(chat)}
                  className={`w-full p-4 text-left border-b border-slate-700 hover:bg-slate-700 transition-colors ${
                    activeChat?.id === chat.id ? "bg-slate-700" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-white text-sm">
                      {chat.reportReference ||
                        `Report #${chat.reportId?.slice(-6)}`}
                    </span>
                    {chat.unreadCount > 0 && (
                      <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                  {chat.reportCategory && (
                    <p className="text-xs text-blue-400 mb-1">
                      {chat.reportCategory}
                    </p>
                  )}
                  <p className="text-sm text-slate-400 truncate">
                    {chat.lastMessage}
                  </p>
                  <span className="text-xs text-slate-500">
                    {new Date(chat.lastMessageTime).toLocaleDateString()}
                  </span>
                </button>
              ))
            ) : (
              <div className="p-8 text-center">
                <MessageCircle
                  size={48}
                  className="text-slate-600 mx-auto mb-4"
                />
                <p className="text-slate-400 text-sm">No conversations yet</p>
                <p className="text-slate-500 text-xs mt-2">
                  Chats are created when police respond to your reports
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeChat ? (
            <>
              <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <Shield size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      {chatInfo?.reportReference ||
                        `Report #${activeChat.reportId?.slice(-6)}`}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {chatInfo?.reportCategory || "Chat with Police"} •{" "}
                      {activeChat.status || "Active"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${
                      isMyMessage(msg) ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[75%] rounded-lg ${
                        msg.senderId === "system"
                          ? "bg-slate-700/50 text-slate-400 text-center text-xs py-2 px-4"
                          : isMyMessage(msg)
                          ? "bg-blue-600 text-white px-4 py-2"
                          : "bg-slate-700 text-white px-4 py-2"
                      }`}
                    >
                      {msg.senderId !== "system" && !isMyMessage(msg) && (
                        <p className="text-xs text-blue-400 mb-1 flex items-center gap-1">
                          <Shield size={12} />
                          {msg.senderName || "Police Officer"}
                        </p>
                      )}
                      <p>{msg.text}</p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={handleSend}
                className="p-4 border-t border-slate-700"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={loading || !newMessage.trim()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle
                  size={64}
                  className="text-slate-600 mx-auto mb-4"
                />
                <p className="text-slate-400">
                  Select a conversation to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
