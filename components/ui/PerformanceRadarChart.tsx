"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

interface PerformanceRadarChartProps {
  data: {
    category: string;
    value: number;
    fullMark?: number;
  }[];
}

export default function PerformanceRadarChart({ data }: PerformanceRadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid stroke="#E5E7EB" />
        <PolarAngleAxis 
          dataKey="category" 
          tick={{ fill: "#6B7280", fontSize: 12 }}
        />
        <PolarRadiusAxis 
          angle={90} 
          domain={[0, 'dataMax']}
          tick={{ fill: "#9CA3AF", fontSize: 10 }}
        />
        <Radar
          name="Performance"
          dataKey="value"
          stroke="#1A73E8"
          fill="#1A73E8"
          fillOpacity={0.3}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
