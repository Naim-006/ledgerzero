import Link from "next/link";
import { ArrowLeft, HelpCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mb-6 shadow-sm">
        <HelpCircle className="w-8 h-8 text-forest-action" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">
        Page Not Found
      </h1>
      <p className="text-sm text-text-dim max-w-sm mb-6 leading-relaxed">
        The page you are looking for does not exist or may have been moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-forest-action text-white hover:bg-forest-action/90 transition-colors shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Shop Overview
      </Link>
    </div>
  );
}
