"use client";

import { useState } from "react";

export function BuyMeCoffee() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-brutal btn-primary fixed bottom-5 right-5 z-30 flex items-center gap-2"
        style={{ fontSize: "0.75rem", padding: "8px 14px" }}
        title="Support this project"
      >
        <CupIcon />
        <span>Support</span>
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div
            className="panel-brutal p-6 max-w-xs w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="-mx-6 -mt-6 px-5 py-3 border-b-2 border-black bg-black mb-5 flex items-center justify-between">
              <span className="font-display text-white text-xl tracking-wider">SUPPORT</span>
              <button
                onClick={() => setOpen(false)}
                className="deck-btn-dark w-7 h-7 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-sm font-medium mb-5 leading-relaxed text-grey-dark">
              Built solo, for fun. If you enjoy it — a coffee helps keep it running.
            </p>

            {/* UPI QR */}
            <div
              className="w-full border-2 border-black overflow-hidden mb-4"
              style={{ boxShadow: "3px 3px 0px #0a0a0a" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/upi-qr.jpeg" alt="UPI QR Code" className="w-full h-auto block" />
            </div>

            <p className="text-[10px] text-grey-mid text-center uppercase tracking-[0.2em]">
              Scan with any UPI app
            </p>
          </div>
        </div>
      )}
    </>
  );
}

// Line-art cup icon — fits the mono design language
function CupIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      {/* Cup body */}
      <path d="M2 5h9v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5Z" />
      {/* Handle */}
      <path d="M11 7h1.5a1.5 1.5 0 0 1 0 3H11" />
      {/* Steam lines */}
      <path d="M5 2.5V1" />
      <path d="M7.5 3V1.5" />
      <path d="M10 2.5V1" />
    </svg>
  );
}
