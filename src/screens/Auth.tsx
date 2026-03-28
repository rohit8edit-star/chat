import React, { useState } from "react";
import {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
} from "../lib/auth";
import { getUser, createUser } from "../lib/db";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Mail, Key, Phone, QrCode } from "lucide-react";
import { motion } from "motion/react";

export default function Auth() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"login" | "signup" | "otp" | "qr">(
    "login",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    try {
      const result = await loginWithGoogle();
      const user = result.user;

      const userProfile = await getUser(user.uid);

      if (!userProfile) {
        await createUser(user.uid, {
          uid: user.uid,
          displayName: user.displayName || "User",
          email: user.email || "",
          photoURL: user.photoURL || "",
          about: "Hey there! I am using NixChat.",
          status: "online",
          lastSeen: new Date().toISOString(),
        });
      }
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (activeTab === "login") {
        await loginWithEmail(email, password);
        navigate("/");
      } else {
        const result = await registerWithEmail(email, password);
        const user = result.user;
        await createUser(user.uid, {
          uid: user.uid,
          displayName: email.split("@")[0],
          email: user.email || "",
          photoURL: "",
          about: "Hey there! I am using NixChat.",
          status: "online",
          lastSeen: new Date().toISOString(),
        });
        navigate("/");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-white p-6 justify-center">
      <div className="flex flex-col items-center mb-10">
        <MessageCircle size={64} className="text-[#2979FF] mb-4" />
        <h1 className="text-3xl font-bold">Welcome to NixChat</h1>
        <p className="text-[#8A8A8A] mt-2 text-center">
          Sign in to connect with friends and family.
        </p>
      </div>

      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="flex bg-[#1E1E1E] rounded-lg p-1">
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "login" ? "bg-[#2979FF] text-white" : "text-[#8A8A8A]"}`}
            onClick={() => setActiveTab("login")}
          >
            Login
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "signup" ? "bg-[#2979FF] text-white" : "text-[#8A8A8A]"}`}
            onClick={() => setActiveTab("signup")}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-[#8A8A8A]" size={20} />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg py-3 pl-10 pr-4 text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#2979FF]"
              required
            />
          </div>
          <div className="relative">
            <Key className="absolute left-3 top-3 text-[#8A8A8A]" size={20} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg py-3 pl-10 pr-4 text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#2979FF]"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#2979FF] hover:bg-[#1565C0] text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {activeTab === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="relative flex items-center py-4">
          <div className="flex-grow border-t border-[#2A2A2A]"></div>
          <span className="flex-shrink-0 mx-4 text-[#8A8A8A] text-sm">or</span>
          <div className="flex-grow border-t border-[#2A2A2A]"></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="w-full bg-white text-black font-semibold py-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="flex justify-center space-x-4 mt-6">
          <button className="flex flex-col items-center text-[#8A8A8A] hover:text-white transition-colors">
            <div className="bg-[#1E1E1E] p-3 rounded-full mb-2">
              <Phone size={20} />
            </div>
            <span className="text-xs">OTP Login</span>
          </button>
          <button className="flex flex-col items-center text-[#8A8A8A] hover:text-white transition-colors">
            <div className="bg-[#1E1E1E] p-3 rounded-full mb-2">
              <QrCode size={20} />
            </div>
            <span className="text-xs">Link Device</span>
          </button>
        </div>
      </div>
    </div>
  );
}
