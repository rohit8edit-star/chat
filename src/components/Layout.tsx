import { Outlet, Navigate } from "react-router-dom";
import BottomNav from "./BottomNav";
import CallManager from "./CallManager";
import { useStore } from "../store/useStore";

export default function Layout() {
  const { user, authReady } = useStore();

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-white">
      <CallManager />
      <main className="flex-1 overflow-y-auto pb-16 no-scrollbar">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
