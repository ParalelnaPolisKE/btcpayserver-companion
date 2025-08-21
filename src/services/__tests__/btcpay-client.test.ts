import axios from "axios";
import type { BTCPayConfig } from "@/types";
import { BTCPayClient } from "../btcpay-client";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("BTCPayClient", () => {
  let client: BTCPayClient;
  let mockAxiosInstance: any;

  const config: BTCPayConfig = {
    serverUrl: "https://btcpay.example.com",
    apiKey: "test-api-key",
    storeId: "test-store-id",
  };

  beforeEach(() => {
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      interceptors: {
        request: {
          use: jest.fn(),
        },
      },
    };
    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    mockedAxios.isAxiosError = jest.fn(() => false) as any;

    // Suppress console logs in tests
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});

    client = new BTCPayClient(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe("verifyConnection", () => {
    it("should return true when connection is successful", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ status: 200 });

      const result = await client.verifyConnection();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        `/api/v1/stores/${config.storeId}`,
      );
      expect(result).toBe(true);
    });

    it("should return false when connection fails", async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(
        new Error("Connection failed"),
      );

      const result = await client.verifyConnection();

      expect(result).toBe(false);
    });
  });

  describe("getInvoices", () => {
    it("should fetch invoices successfully", async () => {
      const mockInvoices = [
        { id: "inv1", amount: "10.00", status: "Settled" },
        { id: "inv2", amount: "20.00", status: "New" },
      ];
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockInvoices });

      const result = await client.getInvoices({ take: 10 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        `/api/v1/stores/${config.storeId}/invoices?take=10`,
      );
      expect(result).toEqual(mockInvoices);
    });

    it("should handle date parameters correctly", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: [] });

      await client.getInvoices({
        startDate: "2024-01-01T00:00:00Z",
        endDate: "2024-12-31T23:59:59Z",
      });

      const url = mockAxiosInstance.get.mock.calls[0][0];
      expect(url).toContain("startDate=1704067200");
      expect(url).toContain("endDate=1735689599");
    });
  });

  describe("getStoreInfo", () => {
    it("should fetch store information successfully", async () => {
      const mockStoreInfo = {
        id: config.storeId,
        name: "Test Store",
        website: "https://test.com",
      };
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockStoreInfo });

      const result = await client.getStoreInfo();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        `/api/v1/stores/${config.storeId}`,
      );
      expect(result).toEqual(mockStoreInfo);
    });
  });

  describe("getPaymentMethods", () => {
    it("should fetch payment methods successfully", async () => {
      const mockPaymentMethods = [
        { enabled: true, cryptoCode: "BTC", name: "Bitcoin" },
        { enabled: true, cryptoCode: "LTC", name: "Litecoin" },
      ];
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockPaymentMethods });

      const result = await client.getPaymentMethods();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        `/api/v1/stores/${config.storeId}/payment-methods`,
      );
      expect(result).toEqual(mockPaymentMethods);
    });
  });
});
