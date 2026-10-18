"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AIWorkspacePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home overview where the Floating Live AI Agent Copilot is active
    router.replace("/");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] text-text-dim text-xs">
      Redirecting to Shop Overview & Live AI Copilot...
    </div>
  );
}
