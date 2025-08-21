/**
 * Memoized MetricCard component for better performance
 */

import { memo } from "react";
import { MetricCard } from "./metric-card";

export const MetricCardMemo = memo(MetricCard, (prevProps, nextProps) => {
  // Custom comparison function for deep equality check
  return (
    prevProps.title === nextProps.title &&
    prevProps.value === nextProps.value &&
    prevProps.description === nextProps.description &&
    prevProps.trend === nextProps.trend &&
    prevProps.trendValue === nextProps.trendValue &&
    JSON.stringify(prevProps.icon) === JSON.stringify(nextProps.icon)
  );
});

MetricCardMemo.displayName = "MetricCardMemo";
