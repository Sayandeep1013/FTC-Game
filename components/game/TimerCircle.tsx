"use client";

import { useEffect, useRef, useState } from "react";

interface TimerCircleProps {
  durationSeconds?: number;
  active: boolean;
  onExpire: () => void;
  size?: number;
}

export function TimerCircle({ durationSeconds = 15, active, onExpire, size = 52 }: TimerCircleProps) {
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

  const r = (size - 6) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const progress = remaining / durationSeconds;
  const dashOffset = circumference * (1 - progress);
  const isUrgent = remaining <= 5 && active;

  return (
    <svg
      width={size}
      height={size}
      style={{ transform: "rotate(-90deg)" }}
    >
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e0e0da" strokeWidth={3} />
      {/* Progress */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={isUrgent ? "#0a0a0a" : "#0a0a0a"}
        strokeWidth={isUrgent ? 4 : 3}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="square"
        style={{
          transition: active ? "stroke-dashoffset 1s linear" : "none",
          opacity: isUrgent ? (remaining % 2 === 0 ? 1 : 0.5) : 1,
        }}
      />
      {/* Number (un-rotate it) */}
      <text
        x={cx} y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          transform: `rotate(90deg)`,
          transformOrigin: `${cx}px ${cy}px`,
          fontSize: size < 48 ? 11 : 14,
          fontWeight: 700,
          fontFamily: "var(--font-mono)",
          fill: isUrgent ? "#0a0a0a" : "#4a4a44",
        }}
      >
        {remaining}
      </text>
    </svg>
  );
}
