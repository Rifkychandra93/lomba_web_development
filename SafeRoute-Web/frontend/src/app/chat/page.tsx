import React from "react";
import { Navbar } from "@/src/components/layout/Navbar";
import { Footer } from "@/src/components/layout/Footer";
import { ChatSidebar } from "@/src/components/chat/ChatSidebar";
import { ChatArea } from "@/src/components/chat/ChatArea";

export default function ChatPage() {
  return (
    <div className="flex h-screen flex-col bg-white overflow-hidden text-neutral-900 font-sans">
      <Navbar activePage="chat" />
      <main className="flex flex-1 overflow-hidden">
        <ChatSidebar />
        <ChatArea />
      </main>
      <Footer />
    </div>
  );
}
