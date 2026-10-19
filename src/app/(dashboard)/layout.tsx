"use client";

import React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { FloatingCopilot } from "@/components/ai/floating-copilot";
import { WelcomeTutorialModal } from "@/components/onboarding/welcome-tutorial-modal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Navigation Sidebar */}
        <div className="hidden lg:flex shrink-0">
          <Sidebar />
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 lg:p-8 pb-20 md:pb-8">
            <div className="max-w-7xl mx-auto space-y-6">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* First-Time User Interactive Walkthrough Tutorial */}
      <WelcomeTutorialModal />

      {/* Floating Conversational & Agentic AI Assistant */}
      <FloatingCopilot />

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
