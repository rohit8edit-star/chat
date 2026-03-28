import { MessageCircle, Phone, CircleDashed, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { clsx } from "clsx";

export default function BottomNav() {
  const location = useLocation();
  const path = location.pathname;

  const navItems = [
    { id: "chats", icon: MessageCircle, label: "Chats", to: "/" },
    { id: "calls", icon: Phone, label: "Calls", to: "/calls" },
    { id: "status", icon: CircleDashed, label: "Status", to: "/status" },
    { id: "profile", icon: User, label: "Profile", to: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-[#2A2A2A] pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = path === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={item.to}
              className={clsx(
                "flex flex-col items-center justify-center w-full h-full space-y-1",
                isActive ? "text-[#2979FF]" : "text-[#8A8A8A]",
              )}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
