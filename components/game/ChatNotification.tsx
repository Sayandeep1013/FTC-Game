"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import type { ChatMessage } from "@/hooks/useChat";

const DISMISS_AFTER_MS = 4000;

interface ChatNotificationProps {
  message: ChatMessage;
  onDismiss: () => void;
  onOpen: () => void;
}

export function ChatNotification({ message, onDismiss, onOpen }: ChatNotificationProps) {
  // Auto-dismiss after DISMISS_AFTER_MS
  useEffect(() => {
    const t = setTimeout(onDismiss, DISMISS_AFTER_MS);
    return () => clearTimeout(t);
  }, [message.id, onDismiss]);

  const preview =
    message.text.length > 58 ? message.text.slice(0, 58) + "…" : message.text;

  return (
    <motion.div
      className="gboard-chat-notif"
      initial={{ x: "110%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "110%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 38 }}
      onClick={() => { onDismiss(); onOpen(); }}
      role="button"
      aria-label={`Chat message from ${message.username}: ${message.text}`}
    >
      {/* Chat icon */}
      <div className="flex-shrink-0" style={{ opacity: 0.55 }}>
        <BubbleIcon />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className="font-bold uppercase tracking-wider leading-none mb-0.5"
          style={{ fontSize: "0.6rem", color: "var(--grey-mid)" }}
        >
          {message.username}
        </p>
        <p
          className="leading-snug"
          style={{ fontSize: "0.75rem", color: "var(--white)" }}
        >
          {preview}
        </p>
      </div>

      {/* Dismiss without opening */}
      <button
        className="flex-shrink-0 flex items-center justify-center w-5 h-5 transition-opacity"
        style={{ fontSize: "0.65rem", color: "var(--grey-dark)", opacity: 0.7 }}
        onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={e => (e.currentTarget.style.opacity = "0.7")}
        onClick={e => { e.stopPropagation(); onDismiss(); }}
        title="Dismiss"
      >
        ✕
      </button>

      {/* Shrinking time bar — pure CSS animation */}
      <motion.div
        className="gboard-chat-notif-bar"
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: DISMISS_AFTER_MS / 1000, ease: "linear" }}
      />
    </motion.div>
  );
}

function BubbleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <path d="M2 3h16v11H2z" />
      <path d="M6 17l4-3" />
    </svg>
  );
}
