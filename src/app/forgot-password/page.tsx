import { Suspense } from "react";
import { HayaLogo } from "@/components/brand/HayaLogo";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata = {
  title: "Forgot Password | Haya Bridal",
  description: "Reset your Haya Bridal account password using an email verification code.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#FAF6F0]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <HayaLogo size="lg" variant="dark" />
        <span className="block mt-2 text-xs font-sans uppercase tracking-[0.25em] text-[#7A6A5F]">
          Account Security
        </span>
        <h2 className="mt-4 font-serif text-3xl text-[#2B211C] font-normal tracking-tight">
          Forgot Your Password?
        </h2>
        <p className="mt-2 text-xs text-[#7A6A5F]">
          We will send a 6-digit one-time passcode (OTP) to your email to verify and reset your password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Suspense fallback={<div className="p-8 text-center text-xs text-[#7A6A5F]">Loading...</div>}>
          <ForgotPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}

