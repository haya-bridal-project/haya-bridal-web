"use client";

import { useEffect, useState } from "react";
import { HayaLogo } from "./HayaLogo";

interface SplashScreenProps {
  customLogoUrl?: string | null;
}

export function SplashScreen({ customLogoUrl }: SplashScreenProps) {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Show only once per browser session so repeat page visits are instant
    try {
      const shown = sessionStorage.getItem("haya_splash_shown");
      if (!shown) {
        setVisible(true);
        // Start fading after 1.4s
        const fadeTimer = setTimeout(() => {
          setFading(true);
        }, 1400);

        // Completely unmount after 1.9s
        const hideTimer = setTimeout(() => {
          setVisible(false);
          sessionStorage.setItem("haya_splash_shown", "1");
        }, 1900);

        return () => {
          clearTimeout(fadeTimer);
          clearTimeout(hideTimer);
        };
      }
    } catch {
      // Storage access blocked or SSR
    }
  }, []);

  const handleDismiss = () => {
    setFading(true);
    setTimeout(() => {
      setVisible(false);
      try {
        sessionStorage.setItem("haya_splash_shown", "1");
      } catch {}
    }, 400);
  };

  if (!visible) return null;

  return (
    <div
      onClick={handleDismiss}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black transition-opacity duration-500 cursor-pointer ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-label="Welcome to Haya Bridal. Click anywhere to proceed."
      role="banner"
    >
      <div className="flex flex-col items-center animate-fade-in text-center p-6">
        <HayaLogo
          size="xl"
          variant="light"
          customLogoUrl={customLogoUrl}
          href=""
        />
        <p className="mt-4 text-xs font-light tracking-[0.3em] uppercase text-[#D4C3B2]/70 font-sans">
          Premium Bridal Rental
        </p>
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        className="absolute bottom-8 text-xs tracking-widest uppercase text-white/40 hover:text-white/80 transition-colors py-2 px-4"
      >
        Skip &rarr;
      </button>
    </div>
  );
}
