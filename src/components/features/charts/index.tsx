"use client";

import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const ChartLoader = () => (
  <div className="flex items-center justify-center py-12">
    <LoadingSpinner size="md" />
  </div>
);

export const StatsBarChart = dynamic(
  () => import("./BarChart").then((mod) => ({ default: mod.StatsBarChart })),
  { loading: ChartLoader, ssr: false }
);

export const StatsLineChart = dynamic(
  () => import("./LineChart").then((mod) => ({ default: mod.StatsLineChart })),
  { loading: ChartLoader, ssr: false }
);

export const StatsRadarChart = dynamic(
  () =>
    import("./RadarChart").then((mod) => ({ default: mod.StatsRadarChart })),
  { loading: ChartLoader, ssr: false }
);
