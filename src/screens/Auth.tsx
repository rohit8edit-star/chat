import React, { useState, useRef, useEffect } from "react";
import {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  sendPhoneOTP,
  verifyPhoneOTP,
} from "../lib/auth";
import { getUser, createUser, getUserByPhone } from "../lib/db";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Mail, Key, Phone, ArrowLeft, User } from "lucide-react";

type Tab = "login" | "signup" | "phone" | "otp" | "profile";

export default function Auth() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const recaptchaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Recaptcha div always in DOM
  }, []);

  // --- Google Login ---
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await loginWithGoogle();
      const user = result.user;
      const userProfile = await getUser(user.uid);
      if (!userProfile) {
        await createUser(user.uid, {
          uid: user.uid,
          displayName: user.displayName || "User",
          email: user.email || "",
          phoneNumber: user.phoneNumber || "",
          photoURL: user.photoURL || "",
          about: "Hey there! I am using NixChat.",
          status: "online",
          lastSeen: new Date().toISOString(),
        });
      }
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Email Login/Signup ---
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
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
          phoneNumber: "",
          photoURL: "",
          about: "Hey there! I am using NixChat.",
          status: "online",
          lastSeen: new Date().toISOString(),
        });
        navigate("/");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Phone OTP Send ---
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Format: +91XXXXXXXXXX
      const formatted = phoneNumber.startsWith("+")
        ? phoneNumber
        : `+91${phoneNumber}`;
      await sendPhoneOTP(formatted, "recaptcha-container");
      setActiveTab("otp");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- OTP Verify ---
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const otpCode = otp.join("");
      const result = await verifyPhoneOTP(otpCode);
      const user = result.user;
      const userProfile = await getUser(user.uid);

      if (!userProfile) {
        // New user — go to profile setup
        setPendingUser(user);
        setActiveTab("profile");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      setError("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- Profile Setup ---
  const handleProfileSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser) return;
    setError("");
    setLoading(true);
    try {
      const formatted = phoneNumber.startsWith("+")
        ? phoneNumber
        : `+91${phoneNumber}`;
      await createUser(pendingUser.uid, {
        uid: pendingUser.uid,
        displayName: displayName,
        email: pendingUser.email || "",
        phoneNumber: formatted,
        photoURL: "",
        about: "Hey there! I am using NixChat.",
        status: "online",
        lastSeen: new Date().toISOString(),
      });
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- OTP Input Handler ---
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-white p-6 justify-center">
      {/* Recaptcha container — hidden */}
      <div id="recaptcha-container" ref={recaptchaRef} className="hidden" />

      <div className="flex flex-col items-center mb-10">
        <MessageCircle size={64} className="text-[#2979FF] mb-4" />
        <h1 className="text-3xl font-bold">NixChat</h1>
        <p className="text-[#8A8A8A] mt-2 text-center">
          Chat. Connect. Nix.
        </p>
      </div>

      <div className="w-full max-w-md mx-auto space-y-6">

        {/* ── PHONE TAB ── */}
        {activeTab === "phone" && (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <button
              type="button"
              onClick={() => setActiveTab("login")}
              className="flex items-center text-[#2979FF] mb-2"
            >
              <ArrowLeft size={18} className="mr-1" /> Back
            </button>
            <h2 className="text-xl font-bold">Enter Phone Number</h2>
            <p className="text-[#8A8A8A] text-sm">
              We'll send a 6-digit OTP to verify your number.
            </p>
            <div className="relative">
              <Phone className="absolute left-3 top-3 text-[#8A8A8A]" size={20} />
              <input
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg py-3 pl-10 pr-4 text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#2979FF]"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2979FF] hover:bg-[#1565C0] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* ── OTP VERIFY ── */}
        {activeTab === "otp" && (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <button
              type="button"
              onClick={() => setActiveTab("phone")}
              className="flex items-center text-[#2979FF] mb-2"
            >
              <ArrowLeft size={18} className="mr-1" /> Back
            </button>
            <h2 className="text-xl font-bold">Enter OTP</h2>
            <p className="text-[#8A8A8A] text-sm">
              Sent to {phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}`}
            </p>
            <div className="flex justify-between gap-2">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  type="number"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-12 h-12 text-center text-xl bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:border-[#2979FF]"
                />
              ))}
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || otp.join("").length < 6}
              className="w-full bg-[#2979FF] hover:bg-[#1565C0] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}

        {/* ── PROFILE SETUP ── */}
        {activeTab === "profile" && (
          <form onSubmit={handleProfileSetup} className="space-y-4">
            <h2 className="text-xl font-bold">Setup Profile</h2>
            <p className="text-[#8A8A8A] text-sm">
              Tell us your name to get started!
            </p>
            <div className="relative">
              <User className="absolute left-3 top-3 text-[#8A8A8A]" size={20} />
              <input
                type="text"
                placeholder="Your Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg py-3 pl-10 pr-4 text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#2979FF]"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2979FF] hover:bg-[#1565C0] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Start Chatting →"}
            </button>
          </form>
        )}

        {/* ── LOGIN / SIGNUP ── */}
        {(activeTab === "login" || activeTab === "signup") && (
          <>
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
                disabled={loading}
                className="w-full bg-[#2979FF] hover:bg-[#1565C0] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? "Please wait..." : activeTab === "login" ? "Sign In" : "Create Account"}
              </button>
            </form>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-[#2A2A2A]"></div>
              <span className="flex-shrink-0 mx-4 text-[#8A8A8A] text-sm">or</span>
              <div className="flex-grow border-t border-[#2A2A2A]"></div>
            </div>

            {/* Google */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white text-black font-semibold py-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Phone OTP */}
            <button
              onClick={() => setActiveTab("phone")}
              className="w-full bg-[#1E1E1E] text-white font-semibold py-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-[#2A2A2A] transition-colors"
            >
              <Phone size={20} className="text-[#2979FF]" />
              <span>Continue with Phone (OTP)</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}