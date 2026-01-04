"use client";

import React from "react";

export default function Button({
  children,
  onClick,
  variant = "primary",
  className = "",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "outline";
  className?: string;
  type?: "button" | "submit" | "reset";
}) {
  const base =
    "px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2";

  const variants = {
    primary:
      "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg active:scale-95",
    secondary:
      "bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-sm hover:shadow active:scale-95",
    danger:
      "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-md hover:shadow-lg active:scale-95",
    outline:
      "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 active:scale-95",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

