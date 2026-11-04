"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export interface FooterAccordionLink {
  label: string;
  href: string;
  strong?: boolean;
}

interface FooterAccordionProps {
  title: string;
  links: FooterAccordionLink[];
}

/**
 * Footer link group. Collapsible accordion on mobile/tablet,
 * always-expanded column on desktop (lg+).
 */
export function FooterAccordion({ title, links }: FooterAccordionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[#E8DDD1] lg:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between py-4 lg:py-0 lg:mb-4 lg:cursor-default text-left"
      >
        <h4 className="font-serif text-base font-normal tracking-wide text-[#2B211C]">
          {title}
        </h4>
        <ChevronDown
          className={`w-4 h-4 text-[#7A6A5F] transition-transform duration-300 lg:hidden ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <ul
        className={`space-y-2.5 text-xs text-[#7A6A5F] pb-4 lg:pb-0 ${
          open ? "block" : "hidden"
        } lg:block`}
      >
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className={`hover:text-[#B06F5E] transition-colors ${
                l.strong ? "font-medium text-[#2B211C]" : ""
              }`}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

