"use client";

import { useEffect, useRef, useState } from "react";

interface TimerBarProps {
  durationSeconds?: number;
  active: boolean;
  onExpire: () => void;
}

export function TimerBar({ durationSeconds = 15, active, onExpire }: TimerBarProps) {
  const [remaining, setRemaining] = useState(durationSeconds);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!active) {
      setRemaining(durationSeconds);
      expiredRef.current = false;
      return;
    }

    expiredRef.current = false;
    setRemaining(durationSeconds);

    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpireRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [active, durationSeconds]);

  const pct = (remaining / durationSeconds) * 100;
  const isUrgent = remaining <= 5;

  return (
    <div className="w-full" title={`${remaining}s remaining`}>
      <div className="timer-track">
        <div
          className={`timer-fill ${isUrgent ? "animate-timer-pulse" : ""}`}
          style={{ width: `${pct}%`, transition: active ? "width 1s linear" : "none" }}
        />
      </div>
    </div>
  );
}
