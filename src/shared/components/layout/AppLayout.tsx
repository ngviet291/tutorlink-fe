import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { ChatbotWidget } from "@/features/chatbot/components/ChatbotWidget";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto flex w-full max-w-screen-2xl gap-6 px-4">
        <Sidebar />
        <main className="min-w-0 flex-1 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 lg:pb-10">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
      <ChatbotWidget />
    </div>
  );
}
