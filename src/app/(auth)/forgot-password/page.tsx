"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, AlertCircle, ArrowLeft, Mail } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = getSupabaseClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        }
      );

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Brand */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-forest flex items-center justify-center font-black text-lg text-lime-accent shadow">
              Ø
            </div>
            <span className="font-bold text-forest text-lg">LEDGER ZERO</span>
          </div>
        </div>

        {submitted ? (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-success-50 border-2 border-success-200 flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-success-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-brand-900">Check your inbox</h1>
              <p className="text-sm text-brand-700/60 mt-2 leading-relaxed">
                We sent a password reset link to{" "}
                <strong className="text-brand-900">{email}</strong>.<br />
                Check your email and follow the link to reset your password.
              </p>
            </div>
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 text-left">
              <strong>Didn&apos;t receive it?</strong> Check your spam folder, or try requesting another link in a few minutes.
            </div>
            <Link href="/sign-in">
              <Button variant="outline" size="md" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-brand-900 tracking-tight">Reset your password</h1>
              <p className="text-sm text-brand-700/60 mt-1">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3 bg-risk-50 border border-risk-200 rounded-lg text-xs text-risk-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-risk-500" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                id="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                isLoading={loading}
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>

            <div className="text-center">
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 hover:text-brand-900 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
