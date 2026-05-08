"use client";

import { useState } from "react";
import { BuyMeCoffee } from "./BuyMeCoffee";

export function Footer() {
  const [copied, setCopied] = useState(false);

  function copyEmail() {
    navigator.clipboard.writeText("sayandeepmondal1013@gmail.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <footer className="border-t-2 border-black bg-white">
      <div
        className="max-w-6xl mx-auto px-4 sm:px-8 flex items-center justify-between gap-4 flex-wrap"
        style={{ minHeight: 56 }}
      >
        {/* Name */}
        <span className="font-display tracking-widest text-sm">SAYANDEEP MONDAL</span>

        {/* Right: contacts + support */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* GitHub */}
          <a
            href="https://github.com/Sayandeep1013"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] font-bold uppercase tracking-wider border border-black px-2.5 py-1.5 hover:bg-black hover:text-white transition-colors"
            title="GitHub"
          >
            GitHub
          </a>

          {/* Say Hi */}
          <button
            onClick={copyEmail}
            className="text-[9px] font-bold uppercase tracking-wider border border-black px-2.5 py-1.5 hover:bg-black hover:text-white transition-colors"
            title="Copy email address"
          >
            {copied ? "Copied ✓" : "Say Hi →"}
          </button>

          {/* Support / Coffee */}
          <BuyMeCoffee compact />
        </div>
      </div>
    </footer>
  );
}
