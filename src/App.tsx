import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { subscribeToAuth, getCurrentUser } from "./lib/auth";
import { getUser, createUser, updateUser } from "./lib/db";
import { useStore } from "./store/useStore";
import { getLocalKeys, generateKeyPair, saveLocalKeys } from "./lib/crypto";

import Splash from "./screens/Splash";
import Auth from "./screens/Auth";
import Layout from "./components/Layout";
import ChatList from "./screens/ChatList";
import ChatRoom from "./screens/ChatRoom";
import Contacts from "./screens/Contacts";
import Calls from "./screens/Calls";
import Status from "./screens/Status";
import Profile from "./screens/Profile";

export default function App() {
  const { setUser, setAuthReady } = useStore();

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (user) => {
      setUser(user);
      setAuthReady(true);

      if (user) {
        // Handle E2EE Keys
        let keys = getLocalKeys(user.uid);
        let publicKeyToSave = keys?.publicKey;

        if (!keys) {
          keys = generateKeyPair();
          saveLocalKeys(user.uid, keys);
          publicKeyToSave = keys.publicKey;
        }

        // Update online status and public key
        try {
          const userProfile = await getUser(user.uid);
          if (userProfile) {
            await updateUser(user.uid, {
              status: "online",
              lastSeen: new Date().toISOString(),
              publicKey: publicKeyToSave,
            });
          } else {
            // Create profile if it doesn't exist (fallback)
            await createUser(user.uid, {
              uid: user.uid,
              displayName:
                user.displayName || user.email?.split("@")[0] || "User",
              email: user.email || "",
              photoURL: user.photoURL || "",
              about: "Hey there! I am using NixChat.",
              status: "online",
              lastSeen: new Date().toISOString(),
              publicKey: publicKeyToSave,
            });
          }
        } catch (error) {
          console.error("Error updating status/keys:", error);
        }
      }
    });

    // Handle visibility change to update online status
    const handleVisibilityChange = async () => {
      const currentUser = getCurrentUser();
      if (currentUser) {
        try {
          const userProfile = await getUser(currentUser.uid);
          if (userProfile) {
            await updateUser(currentUser.uid, {
              status:
                document.visibilityState === "visible" ? "online" : "offline",
              lastSeen: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error("Error updating visibility status:", error);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [setUser, setAuthReady]);

  return (
    <Router>
      <Routes>
        <Route path="/splash" element={<Splash />} />
        <Route path="/auth" element={<Auth />} />
        <Route element={<Layout />}>
          <Route path="/" element={<ChatList />} />
          <Route path="/calls" element={<Calls />} />
          <Route path="/status" element={<Status />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="/chat/:chatId" element={<ChatRoom />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="*" element={<Splash />} />
      </Routes>
    </Router>
  );
}
