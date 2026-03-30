"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface StatsBarChartProps {
  data: { name: string; value: number; [key: string]: unknown }[];
  height?: number;
  color?: string;
  highlightTop?: number;
  valueLabel?: string;
  layout?: "horizontal" | "vertical";
}

const MEDAL_COLORS = ["#f59e0b", "#9ca3af", "#b45309"];

export function StatsBarChart({
  data,
  height = 300,
  color = "#16a34a",
  highlightTop = 3,
  valueLabel = "値",
  layout = "horizontal",
}: StatsBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-gray-400">
        データがありません
      </div>
    );
  }

  if (layout === "vertical") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: "#374151" }}
            tickLine={false}
            width={80}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
            }}
          />
          <Bar dataKey="value" name={valueLabel} radius={[0, 4, 4, 0]}>
            {data.map((_, index) => (
              <Cell
                key={index}
                fill={
                  index < highlightTop
                    ? (MEDAL_COLORS[index] ?? color)
                    : color
                }
                fillOpacity={index < highlightTop ? 1 : 0.6}
              />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#6b7280" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#6b7280" }}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
          }}
        />
        <Bar dataKey="value" name={valueLabel} radius={[4, 4, 0, 0]}>
          {data.map((_, index) => (
            <Cell
              key={index}
              fill={
                index < highlightTop
                  ? (MEDAL_COLORS[index] ?? color)
                  : color
              }
              fillOpacity={index < highlightTop ? 1 : 0.6}
            />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
