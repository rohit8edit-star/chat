import React, { useState } from "react";
import {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  sendEmailVerification,
  resendVerificationEmail,
} from "../lib/auth";
import { getUser, createUser } from "../lib/db";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Mail, Key, ArrowLeft, RefreshCw } from "lucide-react";

type Tab = "login" | "signup" | "verify";

export default function Auth() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);

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
          phoneNumber: "",
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

  // --- Email Login ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await loginWithEmail(email, password);
      const user = result.user;

      // Check email verified
      if (!user.emailVerified) {
        setPendingUser(user);
        setActiveTab("verify");
        return;
      }

      navigate("/");
    } catch (err: any) {
      if (err.code === "auth/invalid-credential") {
        setError("Email ya password galat hai.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Email Signup ---
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await registerWithEmail(email, password);
      const user = result.user;

      // Create user profile
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

      // Send verification email
      await sendEmailVerification(user);
      setPendingUser(user);
      setActiveTab("verify");
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("Ye email already registered hai. Login karo.");
      } else if (err.code === "auth/weak-password") {
        setError("Password kam se kam 6 characters ka hona chahiye.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Resend Verification Email ---
  const handleResend = async () => {
    if (!pendingUser) return;
    try {
      await resendVerificationEmail(pendingUser);
      setResent(true);
      setTimeout(() => setResent(false), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // --- Check if email verified ---
  const handleCheckVerified = async () => {
    if (!pendingUser) return;
    setLoading(true);
    try {
      await pendingUser.reload();
      if (pendingUser.emailVerified) {
        navigate("/");
      } else {
        setError("Email abhi verify nahi hui. Link check karo.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-white p-6 justify-center">
      <div className="flex flex-col items-center mb-10">
        <MessageCircle size={64} className="text-[#2979FF] mb-4" />
        <h1 className="text-3xl font-bold">NixChat</h1>
        <p className="text-[#8A8A8A] mt-2 text-center">Chat. Connect. Nix.</p>
      </div>

      <div className="w-full max-w-md mx-auto space-y-6">

        {/* ── EMAIL VERIFY SCREEN ── */}
        {activeTab === "verify" && (
          <div className="space-y-6 text-center">
            <div className="bg-[#1E1E1E] rounded-2xl p-6">
              <Mail size={48} className="text-[#2979FF] mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Email Verify Karo</h2>
              <p className="text-[#8A8A8A] text-sm">
                <span className="text-white font-medium">{email}</span> pe
                verification link bheja gaya hai.
              </p>
              <p className="text-[#8A8A8A] text-sm mt-2">
                Link pe click karo phir neeche wala button dabao.
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl">
                {error}
              </div>
            )}

            {resent && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm p-3 rounded-xl">
                ✅ Email dobara bheja gaya!
              </div>
            )}

            <button
              onClick={handleCheckVerified}
              disabled={loading}
              className="w-full bg-[#2979FF] hover:bg-[#1565C0] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Checking..." : "✅ Maine Verify Kar Diya"}
            </button>

            <button
              onClick={handleResend}
              className="w-full bg-[#1E1E1E] hover:bg-[#2A2A2A] text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw size={16} />
              Dobara Email Bhejo
            </button>

            <button
              onClick={() => {
                setActiveTab("login");
                setError("");
              }}
              className="flex items-center justify-center text-[#2979FF] text-sm w-full"
            >
              <ArrowLeft size={16} className="mr-1" /> Back to Login
            </button>
          </div>
        )}

        {/* ── LOGIN / SIGNUP ── */}
        {(activeTab === "login" || activeTab === "signup") && (
          <>
            <div className="flex bg-[#1E1E1E] rounded-lg p-1">
              <button
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "login" ? "bg-[#2979FF] text-white" : "text-[#8A8A8A]"}`}
                onClick={() => { setActiveTab("login"); setError(""); }}
              >
                Login
              </button>
              <button
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "signup" ? "bg-[#2979FF] text-white" : "text-[#8A8A8A]"}`}
                onClick={() => { setActiveTab("signup"); setError(""); }}
              >
                Sign Up
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl">
                {error}
              </div>
            )}

            <form
              onSubmit={activeTab === "login" ? handleLogin : handleSignup}
              className="space-y-4"
            >
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
                  placeholder="Password (min 6 characters)"
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
                {loading
                  ? "Please wait..."
                  : activeTab === "login"
                  ? "Sign In"
                  : "Create Account"}
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
          </>
        )}
      </div>
    </div>
  );
}