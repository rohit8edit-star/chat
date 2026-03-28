import { create } from "zustand";
import { User } from "firebase/auth";

interface Chat {
  id: string;
  type: "individual" | "group";
  participants: string[];
  lastMessage?: {
    text: string;
    createdAt: number;
    senderId: string;
  };
  updatedAt: number;
  name?: string;
  photoURL?: string;
}

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
  authReady: boolean;
  setAuthReady: (ready: boolean) => void;
  activeChat: Chat | null;
  setActiveChat: (chat: Chat | null) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  authReady: false,
  setAuthReady: (ready) => set({ authReady: ready }),
  activeChat: null,
  setActiveChat: (chat) => set({ activeChat: chat }),
}));
