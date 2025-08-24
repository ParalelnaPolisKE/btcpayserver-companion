import { TrendingDown, TrendingUp } from "lucide-react";
import React, { useMemo } from "react";
import { Area, AreaChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatPrice } from "@/services/bitcoin-price";

interface BitcoinPriceCardProps {
  priceData: Array<{ date: string; price: number }>;
  currentPrice: number;
  priceChange: {
    percentage: number;
    isPositive: boolean;
  };
}

const chartConfig: ChartConfig = {
  price: {
    label: "BTC Price",
    color: "#52b13d",
  },
};

/**
 * Displays Bitcoin price with mini chart
 * Chart rendering is memoized to prevent expensive recalculations
 */
const BitcoinPriceCard = React.memo<BitcoinPriceCardProps>(
  ({ priceData, currentPrice, priceChange }) => {
    // Memoize gradient ID to ensure consistency
    const gradientId = useMemo(() => "btc-price-gradient", []);

    // Memoize chart component to prevent re-renders
    const chart = useMemo(
      () => (
        <ChartContainer config={chartConfig} className="w-full h-full">
          <AreaChart
            data={priceData}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#52b13d" stopOpacity={0.9} />
                <stop offset="95%" stopColor="#cedc21" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value) => formatPrice(Number(value))}
                />
              }
            />
            <Area
              dataKey="price"
              type="natural"
              fill={`url(#${gradientId})`}
              fillOpacity={1}
              stroke="#52b13d"
              strokeWidth={1.5}
            />
          </AreaChart>
        </ChartContainer>
      ),
      [priceData, gradientId],
    );

    const TrendIcon = priceChange.isPositive ? TrendingUp : TrendingDown;
    const trendColor = priceChange.isPositive
      ? "text-green-500"
      : "text-red-500";

    return (
      <Card className="col-span-1 md:col-span-2 lg:col-span-1 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bitcoin Price</CardTitle>
          <TrendIcon className={`h-4 w-4 ${trendColor}`} />
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">
              {formatPrice(currentPrice)}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className={trendColor}>
                {priceChange.isPositive ? "+" : ""}
                {priceChange.percentage.toFixed(2)}%
              </span>{" "}
              last 30 days
            </p>
          </div>
          <div className="h-[50px] w-[100px] overflow-hidden">{chart}</div>
        </CardContent>
      </Card>
    );
  },
  // Deep comparison for price data array
  (prevProps, nextProps) => {
    return (
      prevProps.currentPrice === nextProps.currentPrice &&
      prevProps.priceChange.percentage === nextProps.priceChange.percentage &&
      prevProps.priceChange.isPositive === nextProps.priceChange.isPositive &&
      JSON.stringify(prevProps.priceData) ===
        JSON.stringify(nextProps.priceData)
    );
  },
);

BitcoinPriceCard.displayName = "BitcoinPriceCard";

export default BitcoinPriceCard;
