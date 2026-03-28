import { useState, useEffect } from "react";
import { subscribeToUserChatsWithDetails } from "../lib/db";
import { useStore } from "../store/useStore";
import { Search, Plus, Check, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function ChatList() {
  const { user } = useStore();
  const navigate = useNavigate();
  const [chats, setChats] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToUserChatsWithDetails(
      user.uid,
      (resolvedChats) => {
        // Sort chats by updatedAt descending
        resolvedChats.sort((a: any, b: any) => {
          const dateA = new Date(a.updatedAt || 0).getTime();
          const dateB = new Date(b.updatedAt || 0).getTime();
          return dateB - dateA;
        });

        // Map properties for UI
        const mappedChats = resolvedChats.map((chat) => ({
          ...chat,
          name: chat.displayName || chat.name,
        }));

        setChats(mappedChats);
      },
    );

    return () => unsubscribe();
  }, [user]);

  const filteredChats = chats.filter((c) =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A]">
      <div className="px-4 pt-12 pb-4 sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-md z-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-white">Chats</h1>
          <div className="flex space-x-4">
            <button className="text-[#2979FF]">Edit</button>
          </div>
        </div>

        <div className="relative">
          <Search
            className="absolute left-3 top-2.5 text-[#8A8A8A]"
            size={20}
          />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1E1E1E] rounded-xl py-2 pl-10 pr-4 text-white placeholder-[#8A8A8A] focus:outline-none focus:ring-1 focus:ring-[#2979FF]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-20">
        <div className="space-y-1">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => navigate(`/chat/${chat.id}`)}
              className="flex items-center py-3 cursor-pointer hover:bg-[#1E1E1E] rounded-xl px-2 transition-colors"
            >
              <div className="relative">
                {chat.photoURL ? (
                  <img
                    src={chat.photoURL}
                    alt={chat.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-[#2A2A2A] flex items-center justify-center text-xl font-medium text-white">
                    {chat.name?.[0]?.toUpperCase()}
                  </div>
                )}
                {chat.status === "online" && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#0A0A0A] rounded-full"></div>
                )}
              </div>

              <div className="ml-4 flex-1 border-b border-[#2A2A2A] pb-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-semibold text-white">
                    {chat.name}
                  </h3>
                  {chat.lastMessage && (
                    <span className="text-xs text-[#8A8A8A]">
                      {format(new Date(chat.lastMessage.createdAt), "h:mm a")}
                    </span>
                  )}
                </div>
                <div className="flex items-center mt-1">
                  {chat.lastMessage?.senderId === user?.uid && (
                    <CheckCheck size={16} className="text-[#2979FF] mr-1" />
                  )}
                  <p className="text-sm text-[#8A8A8A] truncate max-w-[200px]">
                    {chat.lastMessage?.text || "No messages yet"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => navigate("/contacts")}
        className="fixed bottom-20 right-4 w-14 h-14 bg-[#2979FF] rounded-full flex items-center justify-center shadow-lg hover:bg-[#1565C0] transition-colors z-20"
      >
        <Plus size={28} className="text-white" />
      </button>
    </div>
  );
}
