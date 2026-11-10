"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Mail, Lock, KeyRound, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Eye, EyeOff, RefreshCw } from "lucide-react";

interface ForgotPasswordFormProps {
  initialEmail?: string;
  onBackToLogin?: () => void;
  onSuccess?: (email: string) => void;
}

export function ForgotPasswordForm({
  initialEmail = "",
  onBackToLogin,
  onSuccess,
}: ForgotPasswordFormProps) {
  const [step, setStep] = useState<"request" | "verify" | "success">("request");
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [resetToken, setResetToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Resend cooldown timer
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Step 1: Send OTP to Email via Brevo
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send reset code.");
      }

      setResetToken(data.reset_token);
      setStep("verify");
      setCountdown(45); // 45s resend cooldown
      setInfoMsg(`A 6-digit verification code has been sent to ${cleanEmail}.`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error sending reset code.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and set New Password
  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const cleanOtp = otp.trim().replace(/\s+/g, "");
    if (!cleanOtp || cleanOtp.length !== 6) {
      setErrorMsg("Please enter the complete 6-digit OTP code.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-enter.");
      return;
    }

    if (!resetToken) {
      setErrorMsg("Reset session expired. Please request a new code.");
      setStep("request");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: cleanOtp,
          new_password: newPassword,
          reset_token: resetToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }

      setStep("success");
      if (onSuccess) {
        onSuccess(email.trim().toLowerCase());
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Verification error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm py-8 px-6 sm:px-10 shadow-xs">
      {/* Alert Banners */}
      {errorMsg && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {infoMsg && (
        <div className="mb-6 p-3 bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs rounded-sm flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{infoMsg}</span>
        </div>
      )}

      {/* STEP 1: Enter Email */}
      {step === "request" && (
        <form onSubmit={handleSendOtp} className="space-y-5">
          <div>
            <h3 className="font-serif text-lg text-[#2B211C] font-normal mb-1">
              Reset Your Password
            </h3>
            <p className="text-xs text-[#7A6A5F] leading-relaxed">
              Enter the email associated with your Haya account. We will send a 6-digit verification code to your inbox.
            </p>
          </div>

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
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs font-medium tracking-wide uppercase rounded-sm shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? "Sending Verification Code..." : "Send Verification Code"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="pt-2 text-center">
            {onBackToLogin ? (
              <button
                type="button"
                onClick={onBackToLogin}
                className="inline-flex items-center gap-1.5 text-xs text-[#7A6A5F] hover:text-[#2B211C] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-[#7A6A5F] hover:text-[#2B211C] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </Link>
            )}
          </div>
        </form>
      )}

      {/* STEP 2: Enter 6-digit OTP & New Password */}
      {step === "verify" && (
        <form onSubmit={handleVerifyAndReset} className="space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8DDD1]">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#B06F5E] font-semibold block">
                Verification Required
              </span>
              <h3 className="font-serif text-lg text-[#2B211C] font-normal">
                Enter 6-Digit OTP Code
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep("request");
                setErrorMsg(null);
                setInfoMsg(null);
              }}
              className="text-[11px] text-[#7A6A5F] hover:text-[#B06F5E] underline"
            >
              Change Email
            </button>
          </div>

          <div className="text-xs text-[#7A6A5F]">
            Sent to: <strong className="text-[#2B211C] font-mono">{email}</strong>
          </div>

          {/* 6-Digit OTP Input */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-sans">
              Enter 6-Digit OTP
            </label>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={6}
                pattern="[0-9]{6}"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                placeholder="• • • • • •"
                className="w-full pl-9 pr-3 py-3 text-center tracking-[0.5em] font-mono font-bold text-base bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-hidden focus:border-[#B06F5E]"
              />
              <KeyRound className="w-4 h-4 text-[#7A6A5F] absolute left-3 top-3.5 stroke-[1.6]" />
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-sans">
              New Password (min. 6 characters)
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="w-full pl-9 pr-10 py-2.5 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-hidden focus:border-[#B06F5E]"
              />
              <Lock className="w-4 h-4 text-[#7A6A5F] absolute left-3 top-3 stroke-[1.6]" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-[#7A6A5F] hover:text-[#2B211C]"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-sans">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full pl-9 pr-10 py-2.5 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-hidden focus:border-[#B06F5E]"
              />
              <Lock className="w-4 h-4 text-[#7A6A5F] absolute left-3 top-3 stroke-[1.6]" />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full py-3 px-4 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs font-medium tracking-wide uppercase rounded-sm shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? "Updating Password..." : "Update Password & Proceed"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Resend OTP button */}
          <div className="flex items-center justify-between pt-2 text-xs text-[#7A6A5F]">
            <button
              type="button"
              disabled={loading || countdown > 0}
              onClick={() => handleSendOtp()}
              className="inline-flex items-center gap-1.5 text-[#B06F5E] hover:underline disabled:opacity-50 disabled:no-underline"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>{countdown > 0 ? `Resend Code in ${countdown}s` : "Resend OTP Code"}</span>
            </button>

            {onBackToLogin ? (
              <button
                type="button"
                onClick={onBackToLogin}
                className="hover:underline text-[#7A6A5F]"
              >
                Back to Sign In
              </button>
            ) : (
              <Link href="/login" className="hover:underline text-[#7A6A5F]">
                Back to Sign In
              </Link>
            )}
          </div>
        </form>
      )}

      {/* STEP 3: Success Screen */}
      {step === "success" && (
        <div className="text-center py-4 space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-2xs">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div>
            <h3 className="font-serif text-xl text-[#2B211C] font-normal">
              Password Reset Successfully!
            </h3>
            <p className="text-xs text-[#7A6A5F] mt-1 max-w-xs mx-auto leading-relaxed">
              Your new password has been set. You can now sign in with your updated credentials.
            </p>
          </div>

          <div className="pt-2">
            {onBackToLogin ? (
              <button
                type="button"
                onClick={onBackToLogin}
                className="w-full py-3 px-4 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs font-medium tracking-wide uppercase rounded-sm shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full py-3 px-4 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs font-medium tracking-wide uppercase rounded-sm shadow-xs transition-colors gap-2"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

