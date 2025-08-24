import { BTCPayMockClient } from "../btcpay-mock";

describe("BTCPayMockClient", () => {
  let client: BTCPayMockClient;

  beforeEach(() => {
    jest.useFakeTimers();
    // BTCPayMockClient extends BTCPayClient which needs these params
    client = new BTCPayMockClient("mock-key", "https://mock.btcpay.com", "mock-store-001");
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("getInvoices", () => {
    it("returns mock invoices after delay", async () => {
      const promise = client.getInvoices();
      
      // Fast-forward time
      jest.advanceTimersByTime(500);
      
      const invoices = await promise;
      
      expect(invoices).toBeDefined();
      expect(Array.isArray(invoices)).toBe(true);
      expect(invoices.length).toBeGreaterThan(0);
    });

    it("returns invoices with correct structure", async () => {
      jest.advanceTimersByTime(500);
      const invoices = await client.getInvoices();
      
      invoices.forEach(invoice => {
        expect(invoice).toHaveProperty("id");
        expect(invoice).toHaveProperty("storeId");
        expect(invoice).toHaveProperty("amount");
        expect(invoice).toHaveProperty("currency");
        expect(invoice).toHaveProperty("status");
        expect(invoice).toHaveProperty("checkoutLink");
        expect(invoice).toHaveProperty("createdTime");
      });
    });

    it("filters by status when provided", async () => {
      jest.advanceTimersByTime(500);
      const settledInvoices = await client.getInvoices({ status: ["Settled"] });
      
      settledInvoices.forEach(invoice => {
        expect(invoice.status).toBe("Settled");
      });
    });

    it("filters by date range", async () => {
      const startDate = "2024-01-01";
      const endDate = "2024-01-31";
      
      jest.advanceTimersByTime(500);
      const invoices = await client.getInvoices({ startDate, endDate });
      
      invoices.forEach(invoice => {
        const createdTime = new Date(invoice.createdTime);
        expect(createdTime >= new Date(startDate)).toBe(true);
        expect(createdTime <= new Date(endDate + "T23:59:59")).toBe(true);
      });
    });

    it("filters by text search", async () => {
      jest.advanceTimersByTime(500);
      const invoices = await client.getInvoices({ textSearch: "order" });
      
      expect(invoices.length).toBeGreaterThan(0);
      invoices.forEach(invoice => {
        const hasMatch = 
          invoice.id.toLowerCase().includes("order") ||
          JSON.stringify(invoice.metadata).toLowerCase().includes("order");
        expect(hasMatch).toBe(true);
      });
    });

    it("applies take limit", async () => {
      const limit = 5;
      jest.advanceTimersByTime(500);
      const invoices = await client.getInvoices({ take: limit });
      
      expect(invoices.length).toBeLessThanOrEqual(limit);
    });

    it("skips invoices with skip parameter", async () => {
      jest.advanceTimersByTime(500);
      const allInvoices = await client.getInvoices();
      const skippedInvoices = await client.getInvoices({ skip: 5 });
      
      expect(skippedInvoices.length).toBeLessThan(allInvoices.length);
    });
  });

  describe("getInvoice", () => {
    it("returns specific invoice by ID", async () => {
      jest.advanceTimersByTime(300);
      const invoice = await client.getInvoice("INV001");
      
      expect(invoice).toBeDefined();
      expect(invoice.id).toBe("INV001");
    });

    it("returns null for non-existent invoice", async () => {
      jest.advanceTimersByTime(300);
      const invoice = await client.getInvoice("INVALID_ID");
      
      expect(invoice).toBeNull();
    });

    it("returns invoice with metadata", async () => {
      jest.advanceTimersByTime(300);
      const invoice = await client.getInvoice("INV003");
      
      expect(invoice).toBeDefined();
      expect(invoice?.metadata).toBeDefined();
      expect(invoice?.metadata?.itemDesc).toBe("Bitcoin Magazine Annual");
    });
  });

  describe("updateInvoiceMetadata", () => {
    it("updates existing invoice metadata", async () => {
      const newMetadata = { customField: "test value" };
      
      jest.advanceTimersByTime(200);
      const updatedInvoice = await client.updateInvoiceMetadata("INV001", newMetadata);
      
      expect(updatedInvoice).toBeDefined();
      expect(updatedInvoice.metadata).toEqual(newMetadata);
    });

    it("throws error for non-existent invoice", async () => {
      jest.advanceTimersByTime(200);
      
      await expect(
        client.updateInvoiceMetadata("INVALID_ID", { test: "data" })
      ).rejects.toThrow("Invoice not found");
    });

    it("preserves other invoice properties when updating metadata", async () => {
      jest.advanceTimersByTime(300);
      const originalInvoice = await client.getInvoice("INV001");
      
      jest.advanceTimersByTime(200);
      const updatedInvoice = await client.updateInvoiceMetadata("INV001", { new: "metadata" });
      
      expect(updatedInvoice.id).toBe(originalInvoice?.id);
      expect(updatedInvoice.amount).toBe(originalInvoice?.amount);
      expect(updatedInvoice.status).toBe(originalInvoice?.status);
    });
  });

  describe("getStore", () => {
    it("returns mock store data", async () => {
      jest.advanceTimersByTime(200);
      const store = await client.getStore();
      
      expect(store).toBeDefined();
      expect(store.id).toBe("mock-store-001");
      expect(store.name).toBe("Mock BTCPay Store");
    });

    it("returns store with correct structure", async () => {
      jest.advanceTimersByTime(200);
      const store = await client.getStore();
      
      expect(store).toHaveProperty("defaultCurrency");
      expect(store).toHaveProperty("invoiceExpiration");
      expect(store).toHaveProperty("monitoringExpiration");
      expect(store).toHaveProperty("speedPolicy");
      expect(store).toHaveProperty("networkFeeMode");
      expect(store).toHaveProperty("defaultPaymentMethod");
    });

    it("returns consistent data on multiple calls", async () => {
      jest.advanceTimersByTime(200);
      const store1 = await client.getStore();
      
      jest.advanceTimersByTime(200);
      const store2 = await client.getStore();
      
      expect(store1).toEqual(store2);
    });
  });

  describe("mock data generation", () => {
    it("generates diverse invoice statuses", async () => {
      jest.advanceTimersByTime(500);
      const invoices = await client.getInvoices();
      
      const statuses = new Set(invoices.map(inv => inv.status));
      
      // Should have multiple different statuses
      expect(statuses.size).toBeGreaterThan(1);
      expect(statuses.has("Settled")).toBe(true);
    });

    it("generates realistic amounts", async () => {
      jest.advanceTimersByTime(500);
      const invoices = await client.getInvoices();
      
      invoices.forEach(invoice => {
        const amount = parseFloat(invoice.amount);
        expect(amount).toBeGreaterThan(0);
        expect(amount).toBeLessThan(10000); // Reasonable upper limit
      });
    });

    it("generates valid timestamps", async () => {
      jest.advanceTimersByTime(500);
      const invoices = await client.getInvoices();
      
      invoices.forEach(invoice => {
        const created = new Date(invoice.createdTime);
        const expiration = new Date(invoice.expirationTime);
        
        expect(created.getTime()).toBeLessThan(Date.now());
        expect(expiration.getTime()).toBeGreaterThan(created.getTime());
      });
    });

    it("simulates network delay consistently", async () => {
      const promise = client.getInvoices();
      jest.advanceTimersByTime(500);
      const result = await promise;
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("error simulation", () => {
    it("handles empty result sets gracefully", async () => {
      const promise = client.getInvoices({
        textSearch: "definitely-not-found-xyz123"
      });
      jest.advanceTimersByTime(500);
      const invoices = await promise;
      
      expect(invoices).toEqual([]);
    });

    it("maintains data consistency", async () => {
      const promise = client.getInvoices();
      jest.advanceTimersByTime(500);
      const invoices = await promise;
      
      expect(invoices).toBeDefined();
      expect(Array.isArray(invoices)).toBe(true);
      
      // Each invoice should have consistent structure
      if (invoices.length > 0) {
        const invoice = invoices[0];
        expect(invoice).toHaveProperty('id');
        expect(invoice).toHaveProperty('amount');
        expect(invoice).toHaveProperty('status');
        expect(invoice).toHaveProperty('currency');
      }
    });
  });
});