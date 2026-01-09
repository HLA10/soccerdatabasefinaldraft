"use client";

import React from "react";
import Card from "./Card";

interface StatWidgetProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string | number;
    isPositive: boolean;
  };
  className?: string;
}

export default function StatWidget({
  label,
  value,
  icon,
  trend,
  className = "",
}: StatWidgetProps) {
  return (
    <Card className={className}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-[#6B7280] mb-1">{label}</p>
          <p className="text-3xl font-bold text-[#111827]">{value}</p>
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={`text-xs font-medium ${
                  trend.isPositive ? "text-[#10B981]" : "text-[#EF4444]"
                }`}
              >
                {trend.isPositive ? "↑" : "↓"} {trend.value}
              </span>
              <span className="text-xs text-[#9CA3AF]">vs last period</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="ml-4 flex-shrink-0 w-12 h-12 rounded-lg bg-[#EBF4FF] flex items-center justify-center text-[#1A73E8]">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}


