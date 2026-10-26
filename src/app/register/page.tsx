"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { HayaLogo } from "@/components/brand/HayaLogo";
import { Lock, Mail, User, Phone, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/account";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        router.push(next);
        router.refresh();
      } else {
        setSuccess(true);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm py-8 px-6 sm:px-10 shadow-xs">
      {success ? (
        <div className="text-center py-6 space-y-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h3 className="font-serif text-2xl text-[#2B211C]">Account Created</h3>
          <p className="text-xs text-[#7A6A5F] leading-relaxed">
            Please check your email inbox to verify your account, or sign in to continue.
          </p>
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="inline-flex items-center justify-center px-6 py-2.5 bg-[#B06F5E] text-white text-xs font-medium rounded-sm uppercase tracking-wider"
          >
            Proceed to Sign In
          </Link>
        </div>
      ) : (
        <>
          {errorMsg && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-sans">
                Full Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Bride or Groom Name"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-hidden focus:border-[#B06F5E]"
                />
                <User className="w-4 h-4 text-[#7A6A5F] absolute left-3 top-2.5 stroke-[1.6]" />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-sans">
                Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-hidden focus:border-[#B06F5E]"
                />
                <Mail className="w-4 h-4 text-[#7A6A5F] absolute left-3 top-2.5 stroke-[1.6]" />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-sans">
                Contact Phone *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-hidden focus:border-[#B06F5E]"
                />
                <Phone className="w-4 h-4 text-[#7A6A5F] absolute left-3 top-2.5 stroke-[1.6]" />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-sans">
                Password (Min. 6 chars) *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-hidden focus:border-[#B06F5E]"
                />
                <Lock className="w-4 h-4 text-[#7A6A5F] absolute left-3 top-2.5 stroke-[1.6]" />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs font-medium tracking-wide uppercase rounded-sm shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? "Creating Profile..." : "Complete Registration"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-[#E8DDD1] text-center text-xs text-[#7A6A5F]">
            <span>Already have an account? </span>
            <Link
              href={`/login?next=${encodeURIComponent(next)}`}
              className="text-[#B06F5E] hover:underline font-medium"
            >
              Sign In
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#FAF6F0]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <HayaLogo size="lg" variant="dark" />
        <span className="block mt-2 text-xs font-sans uppercase tracking-[0.25em] text-[#7A6A5F]">
          Client Registration
        </span>
        <h2 className="mt-4 font-serif text-3xl text-[#2B211C] font-normal tracking-tight">
          Create Your Haya Profile
        </h2>
        <p className="mt-2 text-xs text-[#7A6A5F]">
          Reserve couture lehengas, track fitting dates, and enjoy bespoke concierge styling.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Suspense fallback={<div className="p-8 text-center text-xs text-[#7A6A5F]">Loading registration...</div>}>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
