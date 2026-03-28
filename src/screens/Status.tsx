import { Plus, Camera, Edit2, Search, X, ArrowLeft } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { subscribeToStatuses, createStatus } from "../lib/db";
import { uploadFile } from "../lib/storage";
import { useStore } from "../store/useStore";
import { format, isAfter, subHours } from "date-fns";

export default function Status() {
  const { user } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [statuses, setStatuses] = useState<any[]>([]);
  const [myStatus, setMyStatus] = useState<any[]>([]);
  const [viewingStatus, setViewingStatus] = useState<any>(null);
  const [activeStatusIndex, setActiveStatusIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;

    // Fetch statuses from the last 24 hours
    const twentyFourHoursAgo = subHours(new Date(), 24).toISOString();

    const unsubscribe = subscribeToStatuses(
      twentyFourHoursAgo,
      (fetchedStatuses) => {
        // Group by user
        const groupedStatuses: Record<string, any> = {};
        const myStatusesList: any[] = [];

        fetchedStatuses.forEach((status) => {
          if (status.userId === user.uid) {
            myStatusesList.push(status);
          } else {
            if (!groupedStatuses[status.userId]) {
              groupedStatuses[status.userId] = {
                userId: status.userId,
                name: status.userName,
                photoURL: status.userPhoto,
                statuses: [],
                lastUpdated: status.createdAt,
              };
            }
            groupedStatuses[status.userId].statuses.push(status);
          }
        });

        setMyStatus(myStatusesList);
        setStatuses(Object.values(groupedStatuses));
      },
    );

    return () => unsubscribe();
  }, [user]);

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        } else if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          async (blob) => {
            if (!blob) return;
            try {
              const filename = `status-${user.uid}-${Date.now()}.jpg`;
              const url = await uploadFile(blob, filename);

              await createStatus({
                userId: user.uid,
                userName: user.displayName || "User",
                userPhoto: user.photoURL || "",
                mediaUrl: url,
                createdAt: new Date().toISOString(),
              });
            } catch (error) {
              console.error("Upload failed", error);
            }
          },
          "image/jpeg",
          0.7,
        );
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const openStatusViewer = (statusGroup: any) => {
    setViewingStatus(statusGroup);
    setActiveStatusIndex(0);
  };

  const closeStatusViewer = () => {
    setViewingStatus(null);
    setActiveStatusIndex(0);
  };

  const nextStatus = () => {
    if (
      viewingStatus &&
      activeStatusIndex < viewingStatus.statuses.length - 1
    ) {
      setActiveStatusIndex(activeStatusIndex + 1);
    } else {
      closeStatusViewer();
    }
  };

  const prevStatus = () => {
    if (viewingStatus && activeStatusIndex > 0) {
      setActiveStatusIndex(activeStatusIndex - 1);
    }
  };

  const filteredStatuses = statuses.filter((s) =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] text-white">
      {/* Status Viewer Modal */}
      {viewingStatus && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
            <button onClick={closeStatusViewer} className="mr-4 text-white">
              <ArrowLeft size={24} />
            </button>
            {viewingStatus.photoURL ? (
              <img
                src={viewingStatus.photoURL}
                alt={viewingStatus.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#2A2A2A] flex items-center justify-center text-lg font-medium text-white">
                {viewingStatus.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="ml-3">
              <h2 className="text-base font-semibold text-white">
                {viewingStatus.name}
              </h2>
              <p className="text-xs text-white/70">
                {format(
                  new Date(viewingStatus.statuses[activeStatusIndex].createdAt),
                  "h:mm a",
                )}
              </p>
            </div>
          </div>

          <div className="flex-1 relative flex items-center justify-center">
            <div className="absolute top-2 left-2 right-2 flex space-x-1 z-10">
              {viewingStatus.statuses.map((_: any, idx: number) => (
                <div
                  key={idx}
                  className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
                >
                  <div
                    className={`h-full bg-white ${idx === activeStatusIndex ? "w-full" : idx < activeStatusIndex ? "w-full" : "w-0"}`}
                  />
                </div>
              ))}
            </div>

            <div className="absolute inset-0 flex">
              <div className="w-1/2 h-full" onClick={prevStatus}></div>
              <div className="w-1/2 h-full" onClick={nextStatus}></div>
            </div>

            <img
              src={viewingStatus.statuses[activeStatusIndex].mediaUrl}
              alt="Status"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}

      <div className="px-4 pt-12 pb-4 sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-md z-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Status</h1>
          <button className="text-[#2979FF]">Privacy</button>
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
        <div className="mb-6">
          <div
            className="flex items-center py-3 cursor-pointer hover:bg-[#1E1E1E] rounded-xl px-2 transition-colors"
            onClick={() => {
              if (myStatus.length > 0) {
                openStatusViewer({
                  userId: user?.uid,
                  name: "My Status",
                  photoURL: user?.photoURL,
                  statuses: myStatus,
                });
              } else {
                fileInputRef.current?.click();
              }
            }}
          >
            <div className="relative">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="My Status"
                  className="w-14 h-14 rounded-full object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#2A2A2A] flex items-center justify-center text-xl font-medium text-white">
                  {user?.displayName?.[0]?.toUpperCase() || "M"}
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-[#2979FF] border-2 border-[#0A0A0A] rounded-full flex items-center justify-center">
                <Plus size={12} className="text-white" />
              </div>
            </div>

            <div className="ml-4 flex-1 border-b border-[#2A2A2A] pb-3">
              <h3 className="text-base font-semibold text-white">My Status</h3>
              <p className="text-sm text-[#8A8A8A]">
                {myStatus.length > 0
                  ? `${myStatus.length} updates`
                  : "Tap to add status update"}
              </p>
            </div>
          </div>
        </div>

        <h2 className="text-sm font-semibold text-[#8A8A8A] mb-4 px-2 uppercase tracking-wider">
          Recent Updates
        </h2>

        <div className="space-y-1">
          {filteredStatuses.length === 0 ? (
            <p className="text-[#8A8A8A] px-2 text-sm">No recent updates.</p>
          ) : (
            filteredStatuses.map((statusGroup) => (
              <div
                key={statusGroup.userId}
                className="flex items-center py-3 cursor-pointer hover:bg-[#1E1E1E] rounded-xl px-2 transition-colors"
                onClick={() => openStatusViewer(statusGroup)}
              >
                <div className="w-14 h-14 rounded-full p-[2px] bg-[#2979FF]">
                  {statusGroup.photoURL ? (
                    <img
                      src={statusGroup.photoURL}
                      alt={statusGroup.name}
                      className="w-full h-full rounded-full border-2 border-[#0A0A0A] object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#2A2A2A] border-2 border-[#0A0A0A] flex items-center justify-center text-xl font-medium text-white">
                      {statusGroup.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="ml-4 flex-1 border-b border-[#2A2A2A] pb-3">
                  <h3 className="text-base font-semibold text-white">
                    {statusGroup.name}
                  </h3>
                  <p className="text-sm text-[#8A8A8A]">
                    {format(new Date(statusGroup.lastUpdated), "h:mm a")}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={handleImageSelected}
      />

      <div className="fixed bottom-20 right-4 flex flex-col space-y-4 z-20">
        <button className="w-12 h-12 bg-[#1E1E1E] rounded-full flex items-center justify-center shadow-lg hover:bg-[#2A2A2A] transition-colors">
          <Edit2 size={20} className="text-white" />
        </button>
        <button
          className="w-14 h-14 bg-[#2979FF] rounded-full flex items-center justify-center shadow-lg hover:bg-[#1565C0] transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Camera size={24} className="text-white" />
        </button>
      </div>
    </div>
  );
}
