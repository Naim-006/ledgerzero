"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: name.trim() },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex w-[420px] shrink-0 bg-forest dark:bg-[#0d1f12] flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
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
              <div className="text-lime-accent/60 text-xs font-medium">Financial Management</div>
            </div>
          </div>
        </div>
        <div className="relative z-10 space-y-4">
          <h2 className="text-3xl font-bold text-white leading-tight">
            Start managing<br />your finances today.
          </h2>
          <p className="text-lime-accent/70 text-sm leading-relaxed">
            Join thousands of small businesses using LEDGER ZERO to stay on top of their cash flow and finances.
          </p>
          <div className="pt-2 p-4 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-white/80 text-xs italic leading-relaxed">
              &ldquo;LEDGER ZERO gave us full visibility into our cash position for the first time. We avoided a major shortfall thanks to the AI alerts.&rdquo;
            </p>
            <p className="text-lime-accent/60 text-[11px] mt-2 font-medium">— Harbor &amp; Pine Supply Co.</p>
          </div>
        </div>
        <div className="relative z-10 text-xs text-white/30">
          © 2026 LEDGER ZERO. Built for modern businesses.
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10">
        <div className="lg:hidden flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-forest flex items-center justify-center font-black text-lg text-lime-accent shadow">
            Ø
          </div>
          <span className="font-bold text-forest text-lg">LEDGER ZERO</span>
        </div>

        <div className="w-full max-w-sm space-y-6">
          {success ? (
            <div className="space-y-5">
              <div className="text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-success-50 border-2 border-success-200 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7 text-success-600" />
                </div>
                <h1 className="text-2xl font-bold text-brand-900">Check your email</h1>
                <p className="text-sm text-brand-700/60 leading-relaxed">
                  We sent a confirmation link to <strong className="text-brand-900">{email}</strong>.<br />
                  Click the link to activate your account.
                </p>
              </div>
              <Link href="/sign-in">
                <Button variant="outline" size="md" className="w-full">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-2xl font-bold text-brand-900 tracking-tight">Create your account</h1>
                <p className="text-sm text-brand-700/60 mt-1">Start your free workspace — no credit card required.</p>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 p-3 bg-risk-50 border border-risk-200 rounded-lg text-xs text-risk-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-risk-500" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Full Name"
                  id="name"
                  placeholder="Alex Vance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />

                <Input
                  label="Work Email"
                  type="email"
                  id="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />

                <div>
                  <label htmlFor="password" className="block text-xs font-semibold text-brand-900 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-700/30 hover:text-brand-700 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  isLoading={loading}
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "Create Account"}
                  {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
                </Button>
              </form>

              <p className="text-center text-xs text-brand-700/50">
                Already have an account?{" "}
                <Link href="/sign-in" className="font-semibold text-forest hover:underline">
                  Sign in
                </Link>
              </p>

              <p className="text-center text-[11px] text-brand-700/30 leading-relaxed">
                By creating an account, you agree to our{" "}
                <Link href="#" className="underline">Terms of Service</Link>{" "}
                and{" "}
                <Link href="#" className="underline">Privacy Policy</Link>.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
