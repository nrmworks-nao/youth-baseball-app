"use client";

import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface RadarChartProps {
  data: { subject: string; value: number; fullMark?: number }[];
  height?: number;
  color?: string;
}

export function StatsRadarChart({
  data,
  height = 300,
  color = "#16a34a",
}: RadarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-gray-400">
        データがありません
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsRadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fontSize: 11, fill: "#374151" }}
        />
        <PolarRadiusAxis
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          axisLine={false}
        />
        <Radar
          dataKey="value"
          stroke={color}
          fill={color}
          fillOpacity={0.25}
          strokeWidth={2}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
          }}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
}
