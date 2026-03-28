import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Video,
  Search,
  Plus,
} from "lucide-react";
import { useState, useEffect } from "react";
import { subscribeToCalls } from "../lib/db";
import { useStore } from "../store/useStore";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function Calls() {
  const { user } = useStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [calls, setCalls] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToCalls(user.uid, (fetchedCalls) => {
      const processedCalls = fetchedCalls.map((data) => {
        const isOutgoing = data.callerId === user.uid;
        return {
          ...data,
          isOutgoing,
          displayName: isOutgoing ? data.receiverName : data.callerName,
          photoURL: isOutgoing ? data.receiverPhoto : data.callerPhoto,
          type: isOutgoing
            ? "outgoing"
            : data.status === "missed"
              ? "missed"
              : "incoming",
        };
      });

      const uniqueCalls = Array.from(
        new Map(processedCalls.map((c) => [c.id, c])).values(),
      );
      const sortedCalls = uniqueCalls.sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
      setCalls(sortedCalls);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredCalls = calls.filter((c) =>
    c.displayName?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] text-white">
      <div className="px-4 pt-12 pb-4 sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-md z-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Calls</h1>
          <button className="text-[#2979FF]">Edit</button>
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
        <h2 className="text-sm font-semibold text-[#8A8A8A] mb-4 px-2 uppercase tracking-wider">
          Recent
        </h2>

        <div className="space-y-1">
          {filteredCalls.length === 0 ? (
            <p className="text-[#8A8A8A] px-2 text-sm">No recent calls.</p>
          ) : (
            filteredCalls.map((call) => (
              <div
                key={call.id}
                className="flex items-center py-3 cursor-pointer hover:bg-[#1E1E1E] rounded-xl px-2 transition-colors"
              >
                {call.photoURL ? (
                  <img
                    src={call.photoURL}
                    alt={call.displayName}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-[#2A2A2A] flex items-center justify-center text-xl font-medium text-white">
                    {call.displayName?.[0]?.toUpperCase()}
                  </div>
                )}

                <div className="ml-4 flex-1 border-b border-[#2A2A2A] pb-3 flex justify-between items-center">
                  <div>
                    <h3
                      className={`text-base font-semibold ${call.type === "missed" ? "text-red-500" : "text-white"}`}
                    >
                      {call.displayName}
                    </h3>
                    <div className="flex items-center mt-1 text-sm text-[#8A8A8A]">
                      {call.type === "missed" && (
                        <PhoneMissed size={14} className="text-red-500 mr-1" />
                      )}
                      {call.type === "incoming" && (
                        <PhoneIncoming
                          size={14}
                          className="text-green-500 mr-1"
                        />
                      )}
                      {call.type === "outgoing" && (
                        <PhoneOutgoing
                          size={14}
                          className="text-[#8A8A8A] mr-1"
                        />
                      )}
                      <span>{format(new Date(call.createdAt), "h:mm a")}</span>
                    </div>
                  </div>
                  <button className="p-2 text-[#2979FF] hover:bg-[#1E1E1E] rounded-full transition-colors">
                    {call.isVideo ? <Video size={24} /> : <Phone size={24} />}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <button
        onClick={() => navigate("/contacts")}
        className="fixed bottom-20 right-4 w-14 h-14 bg-[#2979FF] rounded-full flex items-center justify-center shadow-lg hover:bg-[#1565C0] transition-colors z-20"
      >
        <Phone size={24} className="text-white" />
        <div className="absolute top-3 right-3 w-3 h-3 bg-[#0A0A0A] rounded-full flex items-center justify-center">
          <Plus size={10} className="text-[#2979FF]" />
        </div>
      </button>
    </div>
  );
}
