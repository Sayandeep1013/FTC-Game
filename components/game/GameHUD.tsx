"use client";

import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { TimerCircle } from "./TimerCircle";

interface GameHUDProps {
  deckName: string;
  roundNumber: number;
  isTieActive: boolean;
  potCount: number;
  // Timer — lives in HUD so it's always visible to all players
  isMyTurn: boolean;
  isAnyoneTurn: boolean;
  showResult: boolean;
  deckBrowserOpen: boolean;
  timerTurnKey: number;
  timerDuration: number;
  onTimerExpire: () => void;
  // Mobile landscape: whose-turn label shown in HUD center
  currentTurnName: string;
  isEliminated: boolean;
  // Chat
  chatOpen: boolean;
  unreadCount: number;
  onChatToggle: () => void;
  // Leave
  onLeaveRequest: () => void;
}

export function GameHUD({
  deckName, roundNumber, isTieActive, potCount,
  isMyTurn, isAnyoneTurn, showResult, deckBrowserOpen,
  timerTurnKey, timerDuration, onTimerExpire,
  currentTurnName, isEliminated,
  chatOpen, unreadCount, onChatToggle,
  onLeaveRequest,
}: GameHUDProps) {
  const { user } = useAuth();
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  const showTimer = isAnyoneTurn && !showResult && !deckBrowserOpen;

  return (
    <div className="gboard-hud">
      {/* Left: FTC branding (click = leave request) */}
      <button className="gboard-hud-logo" onClick={onLeaveRequest} title="Leave game">
        FTC
      </button>

      {/* Center (desktop): deck name · round */}
      <div className="gboard-hud-center">
        {/* Desktop: deck + round */}
        <span className="gboard-hud-deck-info" style={{ display: "contents" }}>
          <span className="gboard-hud-deck">{deckName.toUpperCase()}</span>
          <span className="gboard-hud-sep">·</span>
          <span className="gboard-hud-round">R{roundNumber}</span>
        </span>

        {/* TIE badge — visible on both desktop and mobile */}
        {isTieActive && (
          <span className="gboard-hud-tie">
            TIE{potCount > 0 ? ` · ${potCount} POT` : ""}
          </span>
        )}

        {/* Mobile landscape: whose turn (replaces deck/round) */}
        <span className="gboard-hud-turn-mobile">
          {isMyTurn && !isEliminated ? "YOUR TURN" : `${currentTurnName}'S TURN`}
        </span>
      </div>

      {/* Right: timer + chat + avatar + leave */}
      <div className="gboard-hud-right">
        {showTimer && (
          <TimerCircle
            durationSeconds={timerDuration}
            countDown={isAnyoneTurn}
            isActiveTurn={isMyTurn && !isEliminated}
            onExpire={onTimerExpire}
            turnKey={timerTurnKey}
            size={30}
          />
        )}

        {/* Chat toggle */}
        <button
          className={`gboard-hud-chat${chatOpen ? " gboard-hud-chat--open" : ""}`}
          onClick={onChatToggle}
          title="Chat"
        >
          <ChatBubbleIcon />
          CHAT
          {unreadCount > 0 && (
            <span className="gboard-chat-badge">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {avatarUrl && (
          <div className="gboard-hud-avatar">
            <Image src={avatarUrl} alt="You" width={28} height={28} className="object-cover w-full h-full" />
          </div>
        )}

        <button className="gboard-hud-leave" onClick={onLeaveRequest}>
          EXIT
        </button>
      </div>
    </div>
  );
}

function ChatBubbleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <path d="M2 3h16v11H2z" />
      <path d="M6 17l4-3" />
    </svg>
  );
}
