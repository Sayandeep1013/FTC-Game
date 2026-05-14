"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ChatMessage } from "@/hooks/useChat";

interface ChatPanelProps {
  messages: ChatMessage[];
  myPlayerId: string | null;
  onSend: (text: string) => Promise<void>;
  onClose: () => void;
}

export function ChatPanel({ messages, myPlayerId, onSend, onClose }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 220);
    return () => clearTimeout(t);
  }, []);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    await onSend(text);
    setSending(false);
    inputRef.current?.focus();
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* Mobile backdrop */}
      <div className="gboard-chat-backdrop" onClick={onClose} />

      <motion.div
        className="gboard-chat-panel"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "110%" }}
        transition={{ type: "spring", stiffness: 420, damping: 40 }}
      >
        {/* Header */}
        <div className="gboard-chat-header">
          <div className="flex items-center gap-2">
            <ChatIcon />
            <span className="font-display text-white tracking-wider" style={{ fontSize: "1rem" }}>
              CHAT
            </span>
            <span className="text-[7px] text-grey-dark uppercase tracking-wider font-bold">
              {messages.filter(m => !m.isSystem).length} messages
            </span>
          </div>
          <button className="gboard-chat-close" onClick={onClose} title="Close chat">✕</button>
        </div>

        {/* Message list */}
        <div className="gboard-chat-messages scrollbar-brutal">
          <AnimatePresence initial={false}>
            {messages.length === 0 ? (
              <motion.p
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] text-grey-mid text-center uppercase tracking-wider pt-6 pb-2"
              >
                No messages yet.
                <br />Say something!
              </motion.p>
            ) : (
              messages.map((msg, i) => {
                const isMe = msg.player_id === myPlayerId;
                const prevMsg = messages[i - 1];
                const sameAuthor = prevMsg && prevMsg.player_id === msg.player_id && !msg.isSystem && !prevMsg.isSystem;

                if (msg.isSystem) {
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="gboard-chat-system"
                    >
                      {msg.text}
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className={`gboard-chat-msg ${isMe ? "gboard-chat-msg--me" : ""}`}
                    style={{ marginTop: sameAuthor ? 2 : 8 }}
                  >
                    {/* Author name — only show if first in a run, and not your own */}
                    {!isMe && !sameAuthor && (
                      <span className="gboard-chat-msg-name">{msg.username}</span>
                    )}

                    <div className={`gboard-chat-bubble ${isMe ? "gboard-chat-bubble--me" : ""}`}>
                      {msg.text}
                    </div>

                    {/* Timestamp — always shown on last message or after a gap */}
                    <span className="gboard-chat-msg-time">
                      {new Date(msg.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Input row */}
        <div className="gboard-chat-input-row">
          <input
            ref={inputRef}
            className="gboard-chat-input"
            placeholder="Say something…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            maxLength={200}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <button
            className="gboard-chat-send"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            title="Send"
          >
            <SendIcon />
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function ChatIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="rgba(245,245,240,0.7)" strokeWidth="2" strokeLinecap="square">
      <path d="M2 3h16v11H2z" />
      <path d="M6 17l4-3h0" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square">
      <path d="M3 10h14M10 3l7 7-7 7" />
    </svg>
  );
}
