"use client";

import React from "react";

export default function Button({
  children,
  onClick,
  variant = "primary",
  className = "",
  type = "button",
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "outline";
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}) {
  const base =
    "px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variants = {
    primary:
      "bg-[#1A73E8] text-white hover:bg-[#1557B0] shadow-sm hover:shadow active:scale-[0.98] focus:ring-[#1A73E8]",
    secondary:
      "bg-[#F3F4F6] text-[#111827] hover:bg-[#E5E7EB] shadow-sm hover:shadow active:scale-[0.98] focus:ring-[#1A73E8]",
    danger:
      "bg-[#EF4444] text-white hover:bg-[#DC2626] shadow-sm hover:shadow active:scale-[0.98] focus:ring-[#EF4444]",
    outline:
      "border border-[#1A73E8] text-[#1A73E8] bg-transparent hover:bg-[#1A73E8] hover:text-white active:scale-[0.98] focus:ring-[#1A73E8]",
  };

  const disabledStyles = disabled
    ? "opacity-50 cursor-not-allowed hover:shadow-md hover:from-blue-600 hover:to-blue-700"
    : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${disabledStyles} ${className}`}
    >
      {children}
    </button>
  );
}

