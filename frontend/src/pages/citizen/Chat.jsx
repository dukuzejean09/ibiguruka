import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Send, MessageCircle } from "lucide-react";
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
      setMessages(response.data || []);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    setLoading(true);
    try {
      await chatAPI.send(activeChat.id, newMessage);
      setMessages([
        ...messages,
        {
          id: Date.now(),
          text: newMessage,
          senderId: user.id,
          timestamp: new Date().toISOString(),
        },
      ]);
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-12rem)]">
      <div className="bg-slate-800 rounded-lg border border-slate-700 h-full flex overflow-hidden">
        {/* Chat List */}
        <div className="w-80 border-r border-slate-700 flex flex-col">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-lg font-bold text-white">Conversations</h2>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {chats.length > 0 ? (
              chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setActiveChat(chat)}
                  className={`w-full p-4 text-left border-b border-slate-700 hover:bg-slate-700 transition-colors ${
                    activeChat?.id === chat.id ? "bg-slate-700" : ""
                  }`}
                >
                  <div className="font-medium text-white mb-1">
                    Report #{chat.reportId}
                  </div>
                  <p className="text-sm text-slate-400 truncate">
                    {chat.lastMessage}
                  </p>
                  <span className="text-xs text-slate-500">
                    {new Date(chat.lastMessageTime).toLocaleTimeString()}
                  </span>
                </button>
              ))
            ) : (
              <div className="p-8 text-center">
                <MessageCircle
                  size={48}
                  className="text-slate-600 mx-auto mb-4"
                />
                <p className="text-slate-400">No conversations yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeChat ? (
            <>
              <div className="p-4 border-b border-slate-700">
                <h3 className="font-semibold text-white">
                  Report #{activeChat.reportId}
                </h3>
                <p className="text-sm text-slate-400">Chat with Police</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.senderId === user.id ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.senderId === user.id
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-white"
                      }`}
                    >
                      <p>{msg.text}</p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {new Date(msg.timestamp).toLocaleTimeString()}
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
