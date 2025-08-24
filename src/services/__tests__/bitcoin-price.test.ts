import {
  getBitcoinPriceData,
  calculatePriceChange,
  formatPrice,
  type PriceData,
} from "../bitcoin-price";

describe("Bitcoin Price Service", () => {
  describe("getBitcoinPriceData", () => {
    it("returns 30 days of price data", () => {
      const data = getBitcoinPriceData();
      expect(data).toHaveLength(30);
    });

    it("returns data with correct structure", () => {
      const data = getBitcoinPriceData();
      
      data.forEach((item) => {
        expect(item).toHaveProperty("date");
        expect(item).toHaveProperty("price");
        expect(typeof item.date).toBe("string");
        expect(typeof item.price).toBe("number");
      });
    });

    it("returns prices within realistic range", () => {
      const data = getBitcoinPriceData();
      
      data.forEach((item) => {
        // Bitcoin price should be between $80k and $110k (realistic range for mock data)
        expect(item.price).toBeGreaterThan(80000);
        expect(item.price).toBeLessThan(110000);
      });
    });

    it("returns chronologically ordered dates", () => {
      const data = getBitcoinPriceData();
      
      // Dates should be in ascending order (oldest to newest)
      for (let i = 1; i < data.length; i++) {
        const prevDate = new Date(data[i - 1].date);
        const currentDate = new Date(data[i].date);
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(prevDate.getTime());
      }
    });

    it("formats dates correctly", () => {
      const data = getBitcoinPriceData();
      
      data.forEach((item) => {
        // Date should be in format like "Jan 1" or "Dec 31"
        expect(item.date).toMatch(/^[A-Z][a-z]{2} \d{1,2}$/);
      });
    });
  });

  describe("calculatePriceChange", () => {
    it("calculates positive price change correctly", () => {
      const data: PriceData[] = [
        { date: "Jan 1", price: 90000 },
        { date: "Jan 2", price: 95000 },
        { date: "Jan 3", price: 99000 },
      ];

      const result = calculatePriceChange(data);
      
      expect(result.change).toBe(9000); // 99000 - 90000
      expect(result.percentage).toBeCloseTo(10, 1); // (9000/90000)*100 = 10%
      expect(result.isPositive).toBe(true);
    });

    it("calculates negative price change correctly", () => {
      const data: PriceData[] = [
        { date: "Jan 1", price: 100000 },
        { date: "Jan 2", price: 95000 },
        { date: "Jan 3", price: 90000 },
      ];

      const result = calculatePriceChange(data);
      
      expect(result.change).toBe(-10000); // 90000 - 100000
      expect(result.percentage).toBeCloseTo(-10, 1); // (-10000/100000)*100 = -10%
      expect(result.isPositive).toBe(false);
    });

    it("handles zero price change", () => {
      const data: PriceData[] = [
        { date: "Jan 1", price: 95000 },
        { date: "Jan 2", price: 96000 },
        { date: "Jan 3", price: 95000 },
      ];

      const result = calculatePriceChange(data);
      
      expect(result.change).toBe(0);
      expect(result.percentage).toBe(0);
      expect(result.isPositive).toBe(true); // Zero is considered positive
    });

    it("handles empty array", () => {
      const result = calculatePriceChange([]);
      
      expect(result.change).toBe(0);
      expect(result.percentage).toBe(0);
      expect(result.isPositive).toBe(true);
    });

    it("handles single data point", () => {
      const data: PriceData[] = [
        { date: "Jan 1", price: 95000 },
      ];

      const result = calculatePriceChange(data);
      
      expect(result.change).toBe(0);
      expect(result.percentage).toBe(0);
      expect(result.isPositive).toBe(true);
    });

    it("calculates percentage correctly with small changes", () => {
      const data: PriceData[] = [
        { date: "Jan 1", price: 100000 },
        { date: "Jan 2", price: 100100 },
      ];

      const result = calculatePriceChange(data);
      
      expect(result.change).toBe(100);
      expect(result.percentage).toBeCloseTo(0.1, 2); // 0.1%
      expect(result.isPositive).toBe(true);
    });
  });

  describe("formatPrice", () => {
    it("formats whole numbers correctly", () => {
      expect(formatPrice(95000)).toBe("$95,000");
      expect(formatPrice(1000000)).toBe("$1,000,000");
      expect(formatPrice(100)).toBe("$100");
    });

    it("formats zero correctly", () => {
      expect(formatPrice(0)).toBe("$0");
    });

    it("formats negative numbers correctly", () => {
      expect(formatPrice(-1000)).toBe("-$1,000");
      expect(formatPrice(-95000)).toBe("-$95,000");
    });

    it("formats large numbers correctly", () => {
      expect(formatPrice(1234567890)).toBe("$1,234,567,890");
    });

    it("rounds decimal numbers", () => {
      expect(formatPrice(95000.99)).toBe("$95,001");
      expect(formatPrice(95000.49)).toBe("$95,000");
    });

    it("handles very small numbers", () => {
      expect(formatPrice(1)).toBe("$1");
      expect(formatPrice(0.5)).toBe("$1");
      expect(formatPrice(0.4)).toBe("$0");
    });

    it("formats numbers with proper thousand separators", () => {
      expect(formatPrice(1234)).toBe("$1,234");
      expect(formatPrice(12345)).toBe("$12,345");
      expect(formatPrice(123456)).toBe("$123,456");
      expect(formatPrice(1234567)).toBe("$1,234,567");
    });
  });

  describe("Integration tests", () => {
    it("getBitcoinPriceData and calculatePriceChange work together", () => {
      const data = getBitcoinPriceData();
      const priceChange = calculatePriceChange(data);
      
      expect(priceChange).toHaveProperty("change");
      expect(priceChange).toHaveProperty("percentage");
      expect(priceChange).toHaveProperty("isPositive");
      
      // The percentage should be reasonable for a 30-day period
      expect(Math.abs(priceChange.percentage)).toBeLessThan(50);
    });

    it("formatPrice works with getBitcoinPriceData prices", () => {
      const data = getBitcoinPriceData();
      
      data.forEach((item) => {
        const formatted = formatPrice(item.price);
        expect(formatted).toMatch(/^\$[\d,]+$/);
        expect(formatted.length).toBeGreaterThan(1);
      });
    });
  });
});