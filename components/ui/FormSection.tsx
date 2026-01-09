"use client";

import React from "react";
import Card from "./Card";

interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export default function FormSection({
  title,
  description,
  children,
  className = "",
}: FormSectionProps) {
  return (
    <Card className={className}>
      {(title || description) && (
        <div className="mb-6 pb-6 border-b border-[#E5E7EB]">
          {title && (
            <h3 className="text-lg font-semibold text-[#111827] mb-1">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-[#6B7280]">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </Card>
  );
}


