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

  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.2.0";

  return (
    <footer className="border-t-2 border-black bg-white">
      <div
        className="max-w-6xl mx-auto px-4 sm:px-8 flex items-center justify-between gap-4 flex-wrap"
        style={{ minHeight: 56 }}
      >
        {/* Name + version */}
        <div className="flex items-center gap-2.5">
          <span className="font-display tracking-widest text-sm">SAYANDEEP MONDAL</span>
          <span
            className="font-mono text-[9px] font-bold border border-black px-1.5 py-0.5 text-grey-dark"
            title={`FTC v${appVersion}`}
          >
            v{appVersion}
          </span>
        </div>

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
