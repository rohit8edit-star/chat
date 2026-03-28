import { useState } from "react";
import { getUserChats, createChat, getUserByPhone } from "../lib/db";
import { useStore } from "../store/useStore";
import { useNavigate } from "react-router-dom";
import { Search, ArrowLeft, Users, Phone, UserPlus } from "lucide-react";

export default function Contacts() {
  const { user } = useStore();
  const navigate = useNavigate();
  const [phoneInput, setPhoneInput] = useState("");
  const [foundUser, setFoundUser] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  // Search user by phone number
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !phoneInput.trim()) return;

    setSearching(true);
    setFoundUser(null);
    setNotFound(false);
    setError("");

    try {
      const formatted = phoneInput.startsWith("+")
        ? phoneInput
        : `+91${phoneInput}`;

      const found = await getUserByPhone(formatted);

      if (found && found.uid !== user.uid) {
        setFoundUser(found);
      } else if (found && found.uid === user.uid) {
        setError("Ye aapka apna number hai!");
      } else {
        setNotFound(true);
      }
    } catch (err) {
      setError("Search failed. Try again.");
    } finally {
      setSearching(false);
    }
  };

  // Start chat with found user
  const startChat = async (otherUser: any) => {
    if (!user) return;

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
      const newChatId = await createChat({
        type: "individual",
        participants: [user.uid, otherUser.uid],
        updatedAt: new Date().toISOString(),
      });
      navigate(`/chat/${newChatId}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-md z-10">
        <div className="flex items-center mb-4">
          <button onClick={() => navigate(-1)} className="mr-4 text-[#2979FF]">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold">New Chat</h1>
            <p className="text-xs text-[#8A8A8A]">
              Phone number se contact dhundho
            </p>
          </div>
        </div>

        {/* Search by phone */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Phone
              className="absolute left-3 top-2.5 text-[#8A8A8A]"
              size={20}
            />
            <input
              type="tel"
              placeholder="+91 XXXXX XXXXX"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="w-full bg-[#1E1E1E] rounded-xl py-2 pl-10 pr-4 text-white placeholder-[#8A8A8A] focus:outline-none focus:ring-1 focus:ring-[#2979FF]"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="bg-[#2979FF] text-white px-4 rounded-xl font-medium disabled:opacity-50"
          >
            {searching ? "..." : "Search"}
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* Quick options */}
        <div className="space-y-3 mb-6">
          <button className="flex items-center w-full py-3 hover:bg-[#1E1E1E] rounded-xl px-3 transition-colors">
            <div className="w-12 h-12 rounded-full bg-[#2979FF] flex items-center justify-center text-white">
              <Users size={22} />
            </div>
            <span className="ml-4 font-medium">New Group</span>
          </button>
        </div>

        {/* Search result */}
        {foundUser && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-[#8A8A8A] mb-3 px-2 uppercase tracking-wider">
              Result
            </h2>
            <div
              onClick={() => startChat(foundUser)}
              className="flex items-center py-3 cursor-pointer hover:bg-[#1E1E1E] rounded-xl px-3 transition-colors"
            >
              {foundUser.photoURL ? (
                <img
                  src={foundUser.photoURL}
                  alt={foundUser.displayName}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#2979FF] flex items-center justify-center text-lg font-bold text-white">
                  {foundUser.displayName?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="ml-4 flex-1">
                <h3 className="text-base font-semibold text-white">
                  {foundUser.displayName}
                </h3>
                <p className="text-sm text-[#8A8A8A]">
                  {foundUser.phoneNumber}
                </p>
              </div>
              <div className="bg-[#2979FF] p-2 rounded-full">
                <UserPlus size={18} className="text-white" />
              </div>
            </div>
          </div>
        )}

        {/* Not found */}
        {notFound && (
          <div className="text-center py-10">
            <Phone size={48} className="text-[#2A2A2A] mx-auto mb-4" />
            <p className="text-[#8A8A8A] font-medium">
              Koi user nahi mila
            </p>
            <p className="text-[#8A8A8A] text-sm mt-1">
              Is number pe NixChat account nahi hai
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Default state */}
        {!foundUser && !notFound && !error && (
          <div className="text-center py-10">
            <Search size={48} className="text-[#2A2A2A] mx-auto mb-4" />
            <p className="text-[#8A8A8A] font-medium">
              Phone number se dhundho
            </p>
            <p className="text-[#8A8A8A] text-sm mt-1">
              Sirf wahi log dikheinge jo NixChat pe hain
            </p>
          </div>
        )}
      </div>
    </div>
  );
}