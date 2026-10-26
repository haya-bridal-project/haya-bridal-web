import Link from "next/link";
import Image from "next/image";

interface HayaLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "dark" | "light"; // "dark" = for ivory/white backgrounds, "light" = for black/dark splash backgrounds
  customLogoUrl?: string | null;
  href?: string;
}

export function HayaLogo({
  className = "",
  size = "md",
  variant = "dark",
  customLogoUrl,
  href = "/",
}: HayaLogoProps) {
  const isLight = variant === "light";
  const strokeColor = isLight ? "#FFFDF9" : "#2B211C";
  const textColor = isLight ? "#FFFDF9" : "#2B211C";

  const sizeMap = {
    sm: { iconSize: 28, textClass: "text-lg", gap: "gap-2" },
    md: { iconSize: 36, textClass: "text-2xl", gap: "gap-2.5" },
    lg: { iconSize: 48, textClass: "text-3xl", gap: "gap-3" },
    xl: { iconSize: 72, textClass: "text-5xl", gap: "gap-4" },
  };

  const { iconSize, textClass, gap } = sizeMap[size];

  const content = (
    <div className={`inline-flex items-center ${gap} ${className}`}>
      {customLogoUrl ? (
        <div className="relative" style={{ width: iconSize * 1.5, height: iconSize }}>
          <Image
            src={customLogoUrl}
            alt="Haya Logo"
            fill
            className="object-contain"
            sizes="120px"
          />
        </div>
      ) : (
        <>
          {/* Exact vector reproduction of the bridal medallion icon */}
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0 transition-transform duration-300 group-hover:scale-105"
            aria-hidden="true"
          >
            {/* Outer oval ring */}
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeMiterlimit="10"
              strokeDasharray="280"
              strokeDashoffset="0"
              opacity="0.9"
            />
            {/* Inner bridal silhouette: profile face, eye, nose, delicate lips, flowing dupatta/veil & jewelry */}
            <path
              d="M48 20C43 20 38 24 38 31C38 37 42 41 46 44C47.5 45.2 49 46.5 49 49C49 53 45 56 42 59C38 63 34 68 33 76"
              stroke={strokeColor}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Face profile line */}
            <path
              d="M52 30C54 32.5 56 35 56 38.5C56 41 54 42.5 52 44C53 46 54 48 53 50C51 54 48 57 48 60C48 66 54 71 58 75"
              stroke={strokeColor}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Floral maang tikka / hair adornment */}
            <circle cx="51" cy="24" r="2.5" fill={strokeColor} />
            <path
              d="M51 26.5V29.5"
              stroke={strokeColor}
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            {/* Cascading drape / pallu ribbon */}
            <path
              d="M60 36C65 40 68 47 68 55C68 64 63 71 57 76"
              stroke={strokeColor}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M43 32C45 32 47 34 47 36"
              stroke={strokeColor}
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            {/* Subtle neck ornament arc */}
            <path
              d="M45 53C47.5 54.5 50.5 54.5 53 53"
              stroke={strokeColor}
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>

          {/* Luxury script / serif typography */}
          <span
            className={`font-serif tracking-tight font-medium ${textClass}`}
            style={{ color: textColor }}
          >
            Haya
          </span>
        </>
      )}
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} className="group inline-flex items-center focus:outline-none">
      {content}
    </Link>
  );
}
