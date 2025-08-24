import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import BitcoinPriceCard from "../bitcoin-price-card";

// Mock recharts to avoid rendering issues in tests
jest.mock("recharts", () => ({
  Area: () => null,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
}));

// Mock chart components
jest.mock("@/components/ui/chart", () => ({
  ChartContainer: ({ children }: any) => <div data-testid="chart-container">{children}</div>,
  ChartTooltip: () => null,
  ChartTooltipContent: () => null,
}));

describe("BitcoinPriceCard", () => {
  const mockPriceData = [
    { date: "Jan 1", price: 90000 },
    { date: "Jan 2", price: 92000 },
    { date: "Jan 3", price: 95000 },
  ];

  it("renders positive price change correctly", () => {
    render(
      <BitcoinPriceCard
        priceData={mockPriceData}
        currentPrice={95000}
        priceChange={{ percentage: 5.56, isPositive: true }}
      />
    );

    expect(screen.getByText("Bitcoin Price")).toBeInTheDocument();
    expect(screen.getByText("$95,000")).toBeInTheDocument();
    expect(screen.getByText("+5.56%")).toBeInTheDocument();
    expect(screen.getByText("last 30 days")).toBeInTheDocument();

    // Check for green trend icon
    const trendIcon = document.querySelector(".text-green-500");
    expect(trendIcon).toBeInTheDocument();
  });

  it("renders negative price change correctly", () => {
    render(
      <BitcoinPriceCard
        priceData={mockPriceData}
        currentPrice={85000}
        priceChange={{ percentage: -10.53, isPositive: false }}
      />
    );

    expect(screen.getByText("$85,000")).toBeInTheDocument();
    expect(screen.getByText("-10.53%")).toBeInTheDocument();

    // Check for red trend icon
    const trendIcon = document.querySelector(".text-red-500");
    expect(trendIcon).toBeInTheDocument();
  });

  it("formats large prices correctly", () => {
    render(
      <BitcoinPriceCard
        priceData={mockPriceData}
        currentPrice={1234567}
        priceChange={{ percentage: 0, isPositive: true }}
      />
    );

    expect(screen.getByText("$1,234,567")).toBeInTheDocument();
  });

  it("handles zero price change", () => {
    render(
      <BitcoinPriceCard
        priceData={mockPriceData}
        currentPrice={95000}
        priceChange={{ percentage: 0, isPositive: true }}
      />
    );

    expect(screen.getByText("+0.00%")).toBeInTheDocument();
  });

  it("renders chart container", () => {
    render(
      <BitcoinPriceCard
        priceData={mockPriceData}
        currentPrice={95000}
        priceChange={{ percentage: 5.56, isPositive: true }}
      />
    );

    expect(screen.getByTestId("chart-container")).toBeInTheDocument();
    expect(screen.getByTestId("area-chart")).toBeInTheDocument();
  });

  it("does not re-render with same props", () => {
    const props = {
      priceData: mockPriceData,
      currentPrice: 95000,
      priceChange: { percentage: 5.56, isPositive: true },
    };

    const { rerender } = render(<BitcoinPriceCard {...props} />);
    const initialElement = screen.getByText("$95,000");

    // Re-render with same props
    rerender(<BitcoinPriceCard {...props} />);
    const afterRerender = screen.getByText("$95,000");

    expect(initialElement).toBe(afterRerender);
  });

  it("re-renders when price changes", () => {
    const { rerender } = render(
      <BitcoinPriceCard
        priceData={mockPriceData}
        currentPrice={95000}
        priceChange={{ percentage: 5.56, isPositive: true }}
      />
    );

    expect(screen.getByText("$95,000")).toBeInTheDocument();

    rerender(
      <BitcoinPriceCard
        priceData={mockPriceData}
        currentPrice={100000}
        priceChange={{ percentage: 11.11, isPositive: true }}
      />
    );

    expect(screen.getByText("$100,000")).toBeInTheDocument();
    expect(screen.getByText("+11.11%")).toBeInTheDocument();
  });

  it("handles empty price data array", () => {
    render(
      <BitcoinPriceCard
        priceData={[]}
        currentPrice={0}
        priceChange={{ percentage: 0, isPositive: true }}
      />
    );

    expect(screen.getByText("$0")).toBeInTheDocument();
  });

  it("properly formats percentage with two decimal places", () => {
    render(
      <BitcoinPriceCard
        priceData={mockPriceData}
        currentPrice={95000}
        priceChange={{ percentage: 5.5678, isPositive: true }}
      />
    );

    // Should round to 2 decimal places
    expect(screen.getByText("+5.57%")).toBeInTheDocument();
  });

  it("has responsive layout classes", () => {
    const { container } = render(
      <BitcoinPriceCard
        priceData={mockPriceData}
        currentPrice={95000}
        priceChange={{ percentage: 5.56, isPositive: true }}
      />
    );

    const card = container.querySelector(".col-span-1.md\\:col-span-2.lg\\:col-span-1");
    expect(card).toBeInTheDocument();
  });
});