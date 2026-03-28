import { useState, useEffect } from "react";
import { getOtherUsers, getUserChats, createChat } from "../lib/db";
import { useStore } from "../store/useStore";
import { useNavigate } from "react-router-dom";
import { Search, ArrowLeft, Users, QrCode } from "lucide-react";

export default function Contacts() {
  const { user } = useStore();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchUsers = async () => {
      const fetchedUsers = await getOtherUsers(user.uid);
      setUsers(fetchedUsers);
    };

    fetchUsers();
  }, [user]);

  const startChat = async (otherUser: any) => {
    if (!user) return;

    // Check if chat already exists
    const chats = await getUserChats(user.uid);

    let existingChatId = null;
    for (const chat of chats as any[]) {
      if (
        chat.type === "individual" &&
        chat.participants.includes(otherUser.uid)
      ) {
        existingChatId = chat.id;
        break;
      }
    }

    if (existingChatId) {
      navigate(`/chat/${existingChatId}`);
    } else {
      // Create new chat
      const newChatId = await createChat({
        type: "individual",
        participants: [user.uid, otherUser.uid],
        updatedAt: new Date().toISOString(),
      });
      navigate(`/chat/${newChatId}`);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] text-white">
      <div className="px-4 pt-12 pb-4 sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-md z-10">
        <div className="flex items-center mb-4">
          <button onClick={() => navigate(-1)} className="mr-4 text-[#2979FF]">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold">New Chat</h1>
            <p className="text-xs text-[#8A8A8A]">{users.length} contacts</p>
          </div>
        </div>

        <div className="relative">
          <Search
            className="absolute left-3 top-2.5 text-[#8A8A8A]"
            size={20}
          />
          <input
            type="text"
            placeholder="Search contacts"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1E1E1E] rounded-xl py-2 pl-10 pr-4 text-white placeholder-[#8A8A8A] focus:outline-none focus:ring-1 focus:ring-[#2979FF]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="space-y-4 mb-6">
          <button className="flex items-center w-full py-2 hover:bg-[#1E1E1E] rounded-xl px-2 transition-colors">
            <div className="w-12 h-12 rounded-full bg-[#2979FF] flex items-center justify-center text-white">
              <Users size={24} />
            </div>
            <span className="ml-4 font-medium">New Group</span>
          </button>
          <button className="flex items-center w-full py-2 hover:bg-[#1E1E1E] rounded-xl px-2 transition-colors">
            <div className="w-12 h-12 rounded-full bg-[#1E1E1E] flex items-center justify-center text-[#2979FF]">
              <QrCode size={24} />
            </div>
            <span className="ml-4 font-medium">Scan QR Code</span>
          </button>
        </div>

        <h2 className="text-sm font-semibold text-[#8A8A8A] mb-4 px-2 uppercase tracking-wider">
          Contacts on NixChat
        </h2>

        <div className="space-y-1">
          {filteredUsers.map((u) => (
            <div
              key={u.id}
              onClick={() => startChat(u)}
              className="flex items-center py-3 cursor-pointer hover:bg-[#1E1E1E] rounded-xl px-2 transition-colors"
            >
              {u.photoURL ? (
                <img
                  src={u.photoURL}
                  alt={u.displayName}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#2A2A2A] flex items-center justify-center text-lg font-medium text-white">
                  {u.displayName?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="ml-4 flex-1 border-b border-[#2A2A2A] pb-3">
                <h3 className="text-base font-semibold text-white">
                  {u.displayName}
                </h3>
                <p className="text-sm text-[#8A8A8A] truncate">
                  {u.about || "Available"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
