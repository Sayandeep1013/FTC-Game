"use client";

import { useEffect, useRef, useState } from "react";

interface TimerCircleProps {
  durationSeconds?: number;
  /** Start the timer from this value instead of durationSeconds — used when mounting mid-turn */
  initialRemaining?: number;
  /** Whether to count down at all (show static if false) */
  countDown?: boolean;
  /** Whether this client should fire onExpire (only active player) */
  isActiveTurn?: boolean;
  onExpire: () => void;
  /** Change this value to reset the timer — use turn_number or a composite key */
  turnKey?: string | number;
  size?: number;
}

export function TimerCircle({
  durationSeconds = 15,
  initialRemaining,
  countDown = true,
  isActiveTurn = false,
  onExpire,
  turnKey = 0,
  size = 52,
}: TimerCircleProps) {
  const [remaining, setRemaining] = useState(initialRemaining ?? durationSeconds);
  const firedRef       = useRef(false);
  const isActiveRef    = useRef(isActiveTurn);
  const onExpireRef    = useRef(onExpire);
  // Keep refs current without resetting the timer
  isActiveRef.current  = isActiveTurn;
  onExpireRef.current  = onExpire;

  useEffect(() => {
    if (!countDown) return;
    setRemaining(initialRemaining ?? durationSeconds);
    firedRef.current = false;

    const interval = setInterval(() => {
      setRemaining(prev => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          if (isActiveRef.current && !firedRef.current) {
            firedRef.current = true;
            // Small delay so state settles before the callback
            setTimeout(() => onExpireRef.current(), 50);
          }
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  // turnKey + initialRemaining are the reset deps — intentional.
  // isActiveTurn/onExpire changes must NOT reset the timer; they're tracked via refs.
  }, [turnKey, countDown, durationSeconds, initialRemaining]);

  const r            = (size - 6) / 2;
  const cx           = size / 2;
  const cy           = size / 2;
  const circumference = 2 * Math.PI * r;
  const progress     = remaining / durationSeconds;
  const dashOffset   = circumference * (1 - progress);
  const isUrgent     = remaining <= 5 && countDown;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e0e0da" strokeWidth={3} />
      {/* Progress ring */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="#0a0a0a"
        strokeWidth={isUrgent ? 4 : 3}
        strokeDasharray={circumference}
        strokeDashoffset={countDown ? dashOffset : 0}
        strokeLinecap="square"
        style={{
          transition: countDown ? "stroke-dashoffset 1s linear" : "none",
          opacity: isUrgent ? (remaining % 2 === 0 ? 1 : 0.45) : 1,
        }}
      />
      {/* Number label (un-rotated) */}
      <text
        x={cx} y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          transform: `rotate(90deg)`,
          transformOrigin: `${cx}px ${cy}px`,
          fontSize: size < 48 ? 10 : 13,
          fontWeight: 700,
          fontFamily: "var(--font-mono)",
          fill: isUrgent ? "#0a0a0a" : "#4a4a44",
        }}
      >
        {countDown ? remaining : ""}
      </text>
    </svg>
  );
}
