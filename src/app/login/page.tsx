"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { HayaLogo } from "@/components/brand/HayaLogo";
import { Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        throw error;
      }

      router.push(next);
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm py-8 px-6 sm:px-10 shadow-xs">
      {errorMsg && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-sans">
            Email Address
          </label>
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-hidden focus:border-[#B06F5E]"
            />
            <Mail className="w-4 h-4 text-[#7A6A5F] absolute left-3 top-3 stroke-[1.6]" />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-sans">
            Password
          </label>
          <div className="relative">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-hidden focus:border-[#B06F5E]"
            />
            <Lock className="w-4 h-4 text-[#7A6A5F] absolute left-3 top-3 stroke-[1.6]" />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs font-medium tracking-wide uppercase rounded-sm shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? "Signing in..." : "Sign In to Haya"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      <div className="mt-6 pt-6 border-t border-[#E8DDD1] text-center text-xs text-[#7A6A5F]">
        <span>New to Haya? </span>
        <Link
          href={`/register?next=${encodeURIComponent(next)}`}
          className="text-[#B06F5E] hover:underline font-medium"
        >
          Create Client Account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#FAF6F0]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <HayaLogo size="lg" variant="dark" />
        <span className="block mt-2 text-xs font-sans uppercase tracking-[0.25em] text-[#7A6A5F]">
          Client Sign In
        </span>
        <h2 className="mt-4 font-serif text-3xl text-[#2B211C] font-normal tracking-tight">
          Welcome to Your Bridal Vault
        </h2>
        <p className="mt-2 text-xs text-[#7A6A5F]">
          Access your rental bookings, fitting appointments, and saved wishlist.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Suspense fallback={<div className="p-8 text-center text-xs text-[#7A6A5F]">Loading sign-in...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
