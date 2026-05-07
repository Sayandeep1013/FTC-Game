"use client";

import { cn } from "@/lib/utils/cn";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  const base = "btn-brutal";
  const variants = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    danger: "btn-secondary border-dashed",
  };
  const sizes = {
    sm: "text-xs px-3 py-2",
    md: "text-sm px-5 py-3",
    lg: "text-base px-7 py-4",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
