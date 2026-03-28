import React, { useState, useEffect, useRef } from "react";
import { useStore } from "../store/useStore";
import { logout, updateUserProfile, getCurrentUser } from "../lib/auth";
import { getUser, updateUser, createUser } from "../lib/db";
import { uploadFile } from "../lib/storage";
import {
  Camera,
  Edit2,
  LogOut,
  QrCode,
  Shield,
  Bell,
  Key,
  HelpCircle,
  HardDrive,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user } = useStore();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAbout, setEditAbout] = useState("");
  const [activeSetting, setActiveSetting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const data = await getUser(user.uid);
        if (data) {
          setProfile(data);
          setEditName((data as any).displayName || "");
          setEditAbout((data as any).about || "");
        } else {
          const defaultProfile = {
            uid: user.uid,
            displayName:
              user.displayName || user.email?.split("@")[0] || "User",
            email: user.email || "",
            photoURL: user.photoURL || "",
            about: "Hey there! I am using NixChat.",
            status: "online",
            lastSeen: new Date().toISOString(),
          };
          await createUser(user.uid, defaultProfile);
          setProfile(defaultProfile);
          setEditName(defaultProfile.displayName);
          setEditAbout(defaultProfile.about);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setProfile({
          displayName: user.displayName || "User",
          about: "Error loading profile",
        });
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    await updateUser(user.uid, {
      displayName: editName,
      about: editAbout,
    });
    const currentUser = getCurrentUser();
    if (currentUser) {
      await updateUserProfile(currentUser, { displayName: editName });
    }
    setProfile({ ...profile, displayName: editName, about: editAbout });
    setIsEditing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
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
              const filename = `avatar-${user.uid}-${Date.now()}.jpg`;
              const url = await uploadFile(blob, filename);
              await updateUser(user.uid, { photoURL: url });
              const currentUser = getCurrentUser();
              if (currentUser) {
                await updateUserProfile(currentUser, { photoURL: url });
              }
              setProfile({ ...profile, photoURL: url });
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

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  if (!profile)
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white">
        Loading...
      </div>
    );

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] text-white relative">
      {/* Settings Panel Modal */}
      {activeSetting && (
        <div className="absolute inset-0 z-50 bg-[#0A0A0A] flex flex-col animate-in slide-in-from-right">
          <div className="flex items-center p-4 bg-[#1E1E1E] border-b border-[#2A2A2A]">
            <button
              onClick={() => setActiveSetting(null)}
              className="mr-4 text-white"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-semibold text-white">
              {activeSetting}
            </h1>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="bg-[#1E1E1E] rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4 shadow-lg border border-[#2A2A2A]">
              <div className="w-16 h-16 bg-[#2979FF]/20 rounded-full flex items-center justify-center">
                <Shield size={32} className="text-[#2979FF]" />
              </div>
              <h2 className="text-xl font-bold text-white">
                {activeSetting} Settings
              </h2>
              <p className="text-[#8A8A8A]">
                This section is currently in development. You will be able to
                manage your {activeSetting.toLowerCase()} preferences here soon.
              </p>
              <button
                onClick={() => setActiveSetting(null)}
                className="mt-4 px-6 py-2 bg-[#2979FF] text-white rounded-full font-medium hover:bg-[#1565C0] transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 pt-12 pb-4 sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-md z-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Settings</h1>
          <button
            className="text-[#2979FF]"
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
          >
            {isEditing ? "Save" : "Edit"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-20">
        <div className="bg-[#1E1E1E] rounded-2xl p-4 mb-6">
          <div className="flex items-center">
            <div
              className="relative cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {profile.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={profile.displayName}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#2A2A2A] flex items-center justify-center text-3xl font-medium text-white">
                  {profile.displayName?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-7 h-7 bg-[#2979FF] border-2 border-[#1E1E1E] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#1565C0] transition-colors">
                <Camera size={14} className="text-white" />
              </div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>

            <div className="ml-4 flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#2A2A2A] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[#2979FF] mb-2"
                />
              ) : (
                <h2 className="text-xl font-bold text-white">
                  {profile.displayName}
                </h2>
              )}

              {isEditing ? (
                <input
                  type="text"
                  value={editAbout}
                  onChange={(e) => setEditAbout(e.target.value)}
                  className="w-full bg-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-[#8A8A8A] focus:outline-none focus:ring-1 focus:ring-[#2979FF]"
                />
              ) : (
                <p className="text-sm text-[#8A8A8A]">
                  {profile.about || "Available"}
                </p>
              )}
            </div>

            <div
              className="ml-4 p-2 bg-[#2A2A2A] rounded-full cursor-pointer hover:bg-[#333] transition-colors"
              onClick={() => setActiveSetting("QR Code")}
            >
              <QrCode size={24} className="text-[#2979FF]" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <SettingItem
            icon={Key}
            label="Account"
            color="bg-blue-500"
            onClick={() => setActiveSetting("Account")}
          />
          <SettingItem
            icon={Shield}
            label="Privacy"
            color="bg-green-500"
            onClick={() => setActiveSetting("Privacy")}
          />
          <SettingItem
            icon={Bell}
            label="Notifications"
            color="bg-red-500"
            onClick={() => setActiveSetting("Notifications")}
          />
          <SettingItem
            icon={HardDrive}
            label="Storage and Data"
            color="bg-yellow-500"
            onClick={() => setActiveSetting("Storage and Data")}
          />
          <SettingItem
            icon={HelpCircle}
            label="Help"
            color="bg-indigo-500"
            onClick={() => setActiveSetting("Help")}
          />
        </div>

        <div className="mt-8">
          <button
            onClick={handleLogout}
            className="w-full bg-[#1E1E1E] hover:bg-[#2A2A2A] text-red-500 font-semibold py-4 rounded-xl flex items-center justify-center space-x-2 transition-colors"
          >
            <LogOut size={20} />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingItem({
  icon: Icon,
  label,
  color,
  onClick,
}: {
  icon: any;
  label: string;
  color: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="flex items-center p-3 bg-[#1E1E1E] rounded-xl cursor-pointer hover:bg-[#2A2A2A] transition-colors"
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${color}`}
      >
        <Icon size={18} />
      </div>
      <span className="ml-4 font-medium text-white flex-1">{label}</span>
      <svg
        className="w-5 h-5 text-[#8A8A8A]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </div>
  );
}
