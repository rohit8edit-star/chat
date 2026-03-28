import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  subscribeToChatDetails,
  subscribeToMessages,
  sendMessage,
  updateMessage,
  updateChat,
  createCall,
} from "../lib/db";
import { uploadFile } from "../lib/storage";
import { useStore } from "../store/useStore";
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Plus,
  Mic,
  Send,
  Smile,
  Camera,
  Image,
  FileText,
  MapPin,
  UserSquare,
  Lock,
} from "lucide-react";
import { format } from "date-fns";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "motion/react";
import { encryptMessage, decryptMessage, getLocalKeys } from "../lib/crypto";

export default function ChatRoom() {
  const { chatId } = useParams();
  const { user } = useStore();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatInfo, setChatInfo] = useState<any>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showContactProfile, setShowContactProfile] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (!user || !chatId) return;

    const unsubChat = subscribeToChatDetails(
      chatId,
      user.uid,
      (chatData, activeTypingIds) => {
        setChatInfo(chatData);
        setTypingUsers(activeTypingIds);
      },
    );

    const unsubscribe = subscribeToMessages(chatId, (fetchedMessages) => {
      const myKeys = getLocalKeys(user.uid);

      const processedMessages = fetchedMessages.map((msg) => {
        let decryptedText = msg.text;

        // Decrypt if it's an encrypted message and we have keys
        if (msg.isEncrypted && myKeys && chatInfo?.publicKey) {
          const theirPublicKey =
            msg.senderId === user.uid
              ? chatInfo.publicKey
              : msg.senderPublicKey || chatInfo.publicKey;

          if (theirPublicKey) {
            decryptedText = decryptMessage(
              msg.text,
              theirPublicKey,
              myKeys.secretKey,
            );
          }
        }

        return {
          ...msg,
          text: decryptedText,
        };
      });

      setMessages(processedMessages);
      scrollToBottom();

      // Mark unread messages from the other user as read
      fetchedMessages.forEach((msg) => {
        if (msg.senderId !== user.uid && msg.status !== "read") {
          updateMessage(chatId, msg.id, { status: "read" }).catch(
            console.error,
          );
        }
      });
    });

    return () => {
      unsubscribe();
      unsubChat();
    };
  }, [chatId, user, chatInfo?.publicKey]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleTyping = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    if (!chatId || !user) return;

    if (!isTyping) {
      setIsTyping(true);
      await updateChat(chatId, { [`typing.${user.uid}`]: true });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(async () => {
      setIsTyping(false);
      await updateChat(chatId, { [`typing.${user.uid}`]: false });
    }, 2000);
  };

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !chatId) return;

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
              const filename = `chat-${chatId}-${Date.now()}.jpg`;
              const url = await uploadFile(blob, filename);

              const messageData = {
                senderId: user.uid,
                text: "",
                type: "image",
                mediaUrl: url,
                createdAt: new Date().toISOString(),
                status: "sent",
                isEncrypted: false,
              };

              setShowAttachMenu(false);
              await sendMessage(chatId, messageData);

              await updateChat(chatId, {
                lastMessage: {
                  text: "📷 Image",
                  createdAt: messageData.createdAt,
                  senderId: user.uid,
                },
                updatedAt: new Date().toISOString(),
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

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !user || !chatId || !chatInfo) return;

    const myKeys = getLocalKeys(user.uid);
    let messageTextToSave = newMessage;
    let isEncrypted = false;
    let senderPublicKey = myKeys?.publicKey;

    // Encrypt if we have keys and it's a 1-on-1 chat
    if (myKeys && chatInfo.publicKey && chatInfo.type === "individual") {
      messageTextToSave = encryptMessage(
        newMessage,
        chatInfo.publicKey,
        myKeys.secretKey,
      );
      isEncrypted = true;
    }

    const messageData = {
      senderId: user.uid,
      text: messageTextToSave,
      type: "text",
      createdAt: new Date().toISOString(),
      status: "sent",
      isEncrypted,
      senderPublicKey,
    };

    const plainTextForLastMessage = isEncrypted
      ? "🔒 Encrypted message"
      : newMessage;

    setNewMessage("");
    setShowAttachMenu(false);

    // Add message
    await sendMessage(chatId, messageData);

    // Update chat last message
    await updateChat(chatId, {
      lastMessage: {
        text: plainTextForLastMessage,
        createdAt: messageData.createdAt,
        senderId: messageData.senderId,
      },
      updatedAt: new Date().toISOString(),
    });
  };

  const handleCall = async (isVideo: boolean) => {
    if (!user || !chatInfo) return;

    // Create a call document
    await createCall({
      callerId: user.uid,
      callerName: user.displayName || "User",
      callerPhoto: user.photoURL || "",
      receiverId:
        chatInfo.uid ||
        chatInfo.participants?.find((id: string) => id !== user.uid),
      receiverName: chatInfo.displayName || chatInfo.name || "User",
      receiverPhoto: chatInfo.photoURL || "",
      isVideo,
      status: "missed", // default to missed for dummy purposes
      createdAt: new Date().toISOString(),
    });

    alert(`Calling ${chatInfo.displayName || chatInfo.name}...`);
  };

  if (!chatInfo)
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white">
        Loading...
      </div>
    );

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0A] text-white">
      {/* Contact Info Modal */}
      {showContactProfile && chatInfo && (
        <div className="fixed inset-0 z-50 bg-[#0A0A0A] flex flex-col animate-in slide-in-from-right">
          <div className="flex items-center p-4 bg-[#1E1E1E] border-b border-[#2A2A2A]">
            <button
              onClick={() => setShowContactProfile(false)}
              className="mr-4 text-white"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-semibold text-white">Contact info</h1>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col items-center py-8 bg-[#1E1E1E] mb-2">
              {chatInfo.photoURL ? (
                <img
                  src={chatInfo.photoURL}
                  alt={chatInfo.displayName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-[#2A2A2A]"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-[#2A2A2A] flex items-center justify-center text-5xl font-medium text-white">
                  {chatInfo.displayName?.[0]?.toUpperCase()}
                </div>
              )}
              <h2 className="text-2xl font-bold text-white mt-4">
                {chatInfo.displayName}
              </h2>
              <p className="text-[#8A8A8A] text-lg">{chatInfo.email}</p>
            </div>
            <div className="bg-[#1E1E1E] p-4 mb-2">
              <p className="text-[#8A8A8A] text-sm mb-1">About</p>
              <p className="text-white text-lg">
                {chatInfo.about || "Hey there! I am using NixChat."}
              </p>
            </div>
            <div className="bg-[#1E1E1E] p-4 flex justify-between items-center cursor-pointer">
              <p className="text-white text-base">Media, links, and docs</p>
              <p className="text-[#8A8A8A] text-sm">0 {">"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1E1E1E] border-b border-[#2A2A2A] pt-12 z-20">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="mr-3 text-[#2979FF]">
            <ArrowLeft size={24} />
          </button>
          <div
            className="flex items-center cursor-pointer"
            onClick={() => setShowContactProfile(true)}
          >
            {chatInfo.photoURL ? (
              <img
                src={chatInfo.photoURL}
                alt={chatInfo.displayName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#2A2A2A] flex items-center justify-center text-lg font-medium text-white">
                {chatInfo.displayName?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="ml-3">
              <h2 className="text-base font-semibold">
                {chatInfo.displayName}
              </h2>
              <p className="text-xs text-[#2979FF]">
                {typingUsers.length > 0
                  ? "typing..."
                  : chatInfo.status === "online"
                    ? "Online"
                    : "Offline"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4 text-[#2979FF]">
          <button
            onClick={() => handleCall(true)}
            className="hover:text-white transition-colors"
          >
            <Video size={24} />
          </button>
          <button
            onClick={() => handleCall(false)}
            className="hover:text-white transition-colors"
          >
            <Phone size={22} />
          </button>
          <MoreVertical size={24} />
        </div>
      </div>

      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0A0A0A] bg-opacity-95"
        style={{
          backgroundImage:
            'url("https://www.transparenttextures.com/patterns/cubes.png")',
          backgroundBlendMode: "overlay",
        }}
      >
        {chatInfo?.type === "individual" && (
          <div className="flex justify-center my-4">
            <div className="bg-[#1E1E1E] text-[#8A8A8A] text-xs px-4 py-2 rounded-lg text-center max-w-[80%] flex flex-col items-center space-y-1 border border-[#2A2A2A]">
              <Lock size={14} className="text-[#2979FF]" />
              <p>
                Messages and calls are end-to-end encrypted. No one outside of
                this chat, not even NixChat, can read or listen to them.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, index) => {
          const isMe = msg.senderId === user?.uid;
          const showDate =
            index === 0 ||
            format(new Date(messages[index - 1].createdAt), "d MMM") !==
              format(new Date(msg.createdAt), "d MMM");

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex justify-center my-4">
                  <span className="bg-[#1E1E1E] text-[#8A8A8A] text-xs px-3 py-1 rounded-full font-medium">
                    {format(new Date(msg.createdAt), "MMMM d, yyyy")}
                  </span>
                </div>
              )}
              <div
                className={clsx(
                  "flex w-full",
                  isMe ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={clsx(
                    "max-w-[75%] rounded-2xl px-4 py-2 relative group",
                    isMe
                      ? "bg-[#1565C0] text-white rounded-br-sm"
                      : "bg-[#1E1E1E] text-white rounded-bl-sm",
                  )}
                >
                  {msg.type === "image" && msg.mediaUrl && (
                    <img
                      src={msg.mediaUrl}
                      alt="Attached"
                      className="max-w-full rounded-lg mb-1"
                    />
                  )}
                  {msg.text && (
                    <p className="text-[15px] leading-relaxed break-words">
                      {msg.text}
                    </p>
                  )}
                  <div className="flex items-center justify-end mt-1 space-x-1">
                    <span className="text-[10px] text-white/70">
                      {format(new Date(msg.createdAt), "h:mm a")}
                    </span>
                    {isMe && (
                      <span className="text-white/70">
                        {/* Status ticks */}
                        <svg
                          viewBox="0 0 16 15"
                          width="16"
                          height="15"
                          className={
                            msg.status === "read"
                              ? "text-[#2979FF]"
                              : "text-white/70"
                          }
                        >
                          <path
                            fill="currentColor"
                            d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"
                          ></path>
                        </svg>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-[#1E1E1E] px-2 py-3 pb-safe border-t border-[#2A2A2A] relative">
        <AnimatePresence>
          {showAttachMenu && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-16 left-4 bg-[#2A2A2A] rounded-2xl p-4 shadow-2xl grid grid-cols-3 gap-6 w-72 z-30"
            >
              <AttachOption
                icon={Image}
                color="bg-purple-500"
                label="Gallery"
                onClick={() => fileInputRef.current?.click()}
              />
              <AttachOption
                icon={Camera}
                color="bg-pink-500"
                label="Camera"
                onClick={() => fileInputRef.current?.click()}
              />
              <AttachOption
                icon={FileText}
                color="bg-indigo-500"
                label="Document"
              />
              <AttachOption
                icon={MapPin}
                color="bg-green-500"
                label="Location"
              />
              <AttachOption
                icon={UserSquare}
                color="bg-blue-500"
                label="Contact"
              />
              <AttachOption icon={Smile} color="bg-yellow-500" label="Poll" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end space-x-2">
          <button
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className="p-2 text-[#8A8A8A] hover:text-white transition-colors rounded-full"
          >
            <Plus size={28} />
          </button>

          <div className="flex-1 bg-[#2A2A2A] rounded-3xl flex items-center px-3 py-1 min-h-[44px]">
            <button className="p-1 text-[#8A8A8A] hover:text-white transition-colors">
              <Smile size={24} />
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleImageSelected}
            />
            <textarea
              value={newMessage}
              onChange={handleTyping}
              placeholder="Message"
              className="flex-1 bg-transparent text-white placeholder-[#8A8A8A] px-2 py-2 focus:outline-none resize-none max-h-32 min-h-[40px]"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            {newMessage.length === 0 && (
              <button className="p-1 text-[#8A8A8A] hover:text-white transition-colors">
                <Camera size={24} />
              </button>
            )}
          </div>

          {newMessage.trim().length > 0 ? (
            <button
              onClick={handleSendMessage}
              className="p-3 bg-[#2979FF] text-white rounded-full hover:bg-[#1565C0] transition-colors shadow-lg flex-shrink-0"
            >
              <Send size={20} className="ml-1" />
            </button>
          ) : (
            <button className="p-3 bg-[#2979FF] text-white rounded-full hover:bg-[#1565C0] transition-colors shadow-lg flex-shrink-0">
              <Mic size={24} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AttachOption({
  icon: Icon,
  color,
  label,
  onClick,
}: {
  icon: any;
  color: string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center cursor-pointer group"
      onClick={onClick}
    >
      <div
        className={clsx(
          "w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition-transform",
          color,
        )}
      >
        <Icon size={24} />
      </div>
      <span className="text-xs text-white mt-2 font-medium">{label}</span>
    </div>
  );
}
