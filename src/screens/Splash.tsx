import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { MessageCircle } from "lucide-react";

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/auth");
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0A0A]">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <div className="relative">
          <MessageCircle
            size={80}
            className="text-[#2979FF]"
            strokeWidth={1.5}
          />
          <div className="absolute inset-0 bg-[#2979FF] blur-2xl opacity-30 rounded-full" />
        </div>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-white">
          NixChat
        </h1>
        <p className="mt-2 text-sm font-medium tracking-widest text-[#8A8A8A] uppercase">
          Chat. Connect. Nix.
        </p>
      </motion.div>
    </div>
  );
}
