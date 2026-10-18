"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, AlertCircle, ArrowRight } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = getSupabaseClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(
          authError.message === "Invalid login credentials"
            ? "Incorrect email or password. Please try again."
            : authError.message
        );
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel — Brand & Trust */}
      <div className="hidden lg:flex w-[420px] shrink-0 bg-forest dark:bg-[#0d1f12] flex-col justify-between p-10 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-lime-accent blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-lime-accent blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-lime-accent flex items-center justify-center font-black text-xl text-forest shadow">
              Ø
            </div>
            <div>
              <div className="font-bold text-white text-lg tracking-tight">LEDGER ZERO</div>
              <div className="text-lime-accent/60 text-xs font-medium">Financial Operating System</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-white leading-tight">
              Smarter finances<br />for your business.
            </h2>
            <p className="text-lime-accent/70 text-sm mt-3 leading-relaxed">
              Real-time cash flow, automated receivables management, and AI financial co-pilot — built for modern businesses.
            </p>
          </div>

          <div className="space-y-3">
            {[
              "Real-time cash flow & bank reconciliation",
              "Automated invoice collection & reminders",
              "Autonomous AI financial co-pilot",
              "Multi-currency & jurisdictional support",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2.5 text-sm text-white/80">
                <div className="w-1.5 h-1.5 rounded-full bg-lime-accent shrink-0" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-white/30">
          © 2026 LEDGER ZERO. Built for modern businesses.
        </div>
      </div>

      {/* Right Panel — Clean Sign-In Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10">
        {/* Mobile brand header */}
        <div className="lg:hidden flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-forest flex items-center justify-center font-black text-lg text-lime-accent shadow">
            Ø
          </div>
          <span className="font-bold text-forest text-lg">LEDGER ZERO</span>
        </div>

        <div className="w-full max-w-sm space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-brand-900 tracking-tight">Sign in to your account</h1>
            <p className="text-sm text-brand-700/60 mt-1">Enter your details to access your financial workspace</p>
          </div>

          {/* Error notification */}
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-risk-50 border border-risk-200 rounded-xl text-xs text-risk-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-risk-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <Input
              label="Work Email"
              type="email"
              id="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="text-xs font-semibold text-brand-900">Password</label>
                <Link href="/forgot-password" className="text-xs text-forest hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-700/40 hover:text-brand-700 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-semibold shadow-xs"
              isLoading={loading}
            >
              Sign In
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          {/* Sign Up Footer */}
          <div className="pt-2 text-center text-xs text-brand-700/70 border-t border-slateSurface-100">
            Don&apos;t have an account yet?{" "}
            <Link href="/sign-up" className="font-semibold text-forest hover:underline">
              Create a free account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
