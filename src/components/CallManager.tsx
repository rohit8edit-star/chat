import React, { useEffect, useState } from "react";
import { subscribeToCalls, updateCall } from "../lib/db";
import { useStore } from "../store/useStore";
import { Phone, PhoneOff, Mic, MicOff } from "lucide-react";

export default function CallManager() {
  const { user } = useStore();
  const [activeCall, setActiveCall] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToCalls(user.uid, (calls) => {
      let currentCall = null;
      for (const callData of calls) {
        if (["calling", "accepted"].includes(callData.status)) {
          if (
            !currentCall ||
            new Date(callData.createdAt) > new Date(currentCall.createdAt)
          ) {
            currentCall = callData;
          }
        }
      }
      setActiveCall(currentCall);
    });

    return () => unsubscribe();
  }, [user]);

  if (!activeCall) return null;

  const isIncoming =
    activeCall.receiverId === user?.uid && activeCall.status === "calling";
  const isOngoing = activeCall.status === "accepted";
  const isOutgoing =
    activeCall.callerId === user?.uid && activeCall.status === "calling";

  const otherPersonName =
    activeCall.callerId === user?.uid
      ? activeCall.receiverName
      : activeCall.callerName;
  const otherPersonPhoto =
    activeCall.callerId === user?.uid
      ? activeCall.receiverPhoto
      : activeCall.callerPhoto;

  const handleAccept = async () => {
    await updateCall(activeCall.id, { status: "accepted" });
  };

  const handleReject = async () => {
    await updateCall(activeCall.id, { status: "rejected" });
  };

  const handleEnd = async () => {
    await updateCall(activeCall.id, { status: "ended" });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0A0A0A] flex flex-col items-center justify-between py-20">
      <div className="flex flex-col items-center space-y-6">
        <h2 className="text-white/70 text-lg">
          {isIncoming
            ? "Incoming Call..."
            : isOutgoing
              ? "Calling..."
              : "Ongoing Call"}
        </h2>
        <div className="w-32 h-32 rounded-full overflow-hidden bg-[#2A2A2A] border-4 border-[#2979FF]">
          {otherPersonPhoto ? (
            <img
              src={otherPersonPhoto}
              alt={otherPersonName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl text-white">
              {otherPersonName?.[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <h1 className="text-3xl font-bold text-white">{otherPersonName}</h1>
        {isOngoing && <p className="text-[#2979FF]">00:00</p>}
      </div>

      <div className="flex items-center justify-center space-x-8 w-full px-8">
        {isIncoming ? (
          <>
            <button
              onClick={handleReject}
              className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600"
            >
              <PhoneOff size={28} className="text-white" />
            </button>
            <button
              onClick={handleAccept}
              className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 animate-bounce"
            >
              <Phone size={28} className="text-white" />
            </button>
          </>
        ) : (
          <>
            {isOngoing && (
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${isMuted ? "bg-white text-black" : "bg-[#2A2A2A] text-white"}`}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>
            )}
            <button
              onClick={handleEnd}
              className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600"
            >
              <PhoneOff size={28} className="text-white" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
