"use client";

import { useEffect, useState } from "react";
import { HayaLogo } from "./HayaLogo";

interface SplashScreenProps {
  customLogoUrl?: string | null;
}

export function SplashScreen({ customLogoUrl }: SplashScreenProps) {
  // Start visible on SSR & first paint so pre-intro always leads BEFORE the storefront is revealed.
  // Repeat visits in the same session are hidden before paint via .haya-splash-done in layout.tsx.
  const [dismissed, setDismissed] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    try {
      const shown = sessionStorage.getItem("haya_splash_shown");
      if (shown) {
        const unmountTimer = setTimeout(() => setDismissed(true), 0);
        return () => clearTimeout(unmountTimer);
      }
    } catch {
      // Storage blocked
    }

    const fadeTimer = setTimeout(() => setFading(true), 1400);
    const hideTimer = setTimeout(() => {
      setDismissed(true);
      try {
        sessionStorage.setItem("haya_splash_shown", "1");
        document.documentElement.classList.add("haya-splash-done");
      } catch {}
    }, 1900);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  const handleDismiss = () => {
    setFading(true);
    setTimeout(() => {
      setDismissed(true);
      try {
        sessionStorage.setItem("haya_splash_shown", "1");
        document.documentElement.classList.add("haya-splash-done");
      } catch {}
    }, 400);
  };

  if (dismissed) return null;

  return (
    <div
      onClick={handleDismiss}
      className={`haya-splash-overlay fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black transition-opacity duration-500 cursor-pointer ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-label="Welcome to Haya Bridal. Click anywhere to proceed."
      role="banner"
    >
      <div className="flex flex-col items-center text-center p-6">
        <HayaLogo
          size="xl"
          variant="light"
          customLogoUrl={customLogoUrl}
          href=""
        />
        <p className="mt-4 text-xs font-light tracking-[0.3em] uppercase text-[#D4C3B2]/70 font-sans">
          Bridal Couture &amp; Fine Ornaments
        </p>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleDismiss();
        }}
        className="absolute bottom-8 text-xs tracking-widest uppercase text-white/40 hover:text-white/80 transition-colors py-2 px-4"
      >
        Skip &rarr;
      </button>
    </div>
  );
}
