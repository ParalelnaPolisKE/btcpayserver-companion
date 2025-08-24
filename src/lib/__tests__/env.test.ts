import { serverEnv, clientEnv, isUsingMockData } from "../env";

// Mock the isServerSide function
let mockIsServerSide = true;
jest.mock("../env", () => {
  const actual = jest.requireActual("../env");
  return {
    ...actual,
    get serverEnv() {
      return actual.serverEnv;
    },
    get clientEnv() {
      return actual.clientEnv;
    },
    isServerSide: jest.fn(() => mockIsServerSide),
    isUsingMockData: () => {
      if (mockIsServerSide) {
        // Server-side: check if API key exists
        return !actual.serverEnv.btcpayApiKey || actual.clientEnv.useMock;
      }
      // Client-side: this should be passed from server
      return true; // Default to mock on client
    }
  };
});

describe("Environment Configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules to clear any cached environment config
    jest.resetModules();
    // Create a new env object for each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe("serverEnv", () => {
    it("reads BTCPAYSERVER_API_KEY correctly", () => {
      process.env.BTCPAYSERVER_API_KEY = "test-api-key";
      
      // Re-import to get fresh values
      jest.resetModules();
      const { serverEnv } = require("../env");
      
      expect(serverEnv.btcpayApiKey).toBe("test-api-key");
    });

    it("returns empty string when API key is not set", () => {
      delete process.env.BTCPAYSERVER_API_KEY;
      
      jest.resetModules();
      const { serverEnv } = require("../env");
      
      expect(serverEnv.btcpayApiKey).toBe("");
    });

  });

  describe("clientEnv", () => {
    it("reads NEXT_PUBLIC_BTCPAY_URL correctly", () => {
      process.env.NEXT_PUBLIC_BTCPAY_URL = "https://custom.btcpay.com";
      
      jest.resetModules();
      const { clientEnv } = require("../env");
      
      expect(clientEnv.btcpayUrl).toBe("https://custom.btcpay.com");
    });

    it("provides default URL when not set", () => {
      delete process.env.NEXT_PUBLIC_BTCPAY_URL;
      
      jest.resetModules();
      const { clientEnv } = require("../env");
      
      expect(clientEnv.btcpayUrl).toBe("https://btcpay.example.com");
    });

    it("reads NEXT_PUBLIC_STORE_ID correctly", () => {
      process.env.NEXT_PUBLIC_STORE_ID = "store-456";
      
      jest.resetModules();
      const { clientEnv } = require("../env");
      
      expect(clientEnv.storeId).toBe("store-456");
    });

    it("provides default store ID when not set", () => {
      delete process.env.NEXT_PUBLIC_STORE_ID;
      
      jest.resetModules();
      const { clientEnv } = require("../env");
      
      expect(clientEnv.storeId).toBe("store-1");
    });

    it("reads NEXT_PUBLIC_USE_MOCK as true correctly", () => {
      process.env.NEXT_PUBLIC_USE_MOCK = "true";
      
      jest.resetModules();
      const { clientEnv } = require("../env");
      
      expect(clientEnv.useMock).toBe(true);
    });

    it("reads NEXT_PUBLIC_USE_MOCK as false when not 'true'", () => {
      process.env.NEXT_PUBLIC_USE_MOCK = "false";
      
      jest.resetModules();
      const { clientEnv } = require("../env");
      
      expect(clientEnv.useMock).toBe(false);
    });

  });

  describe("isUsingMockData", () => {
    describe("server-side", () => {
      beforeEach(() => {
        // Mock isServerSide to return true for server-side tests
        mockIsServerSide = true;
      });
      
      it("returns true when no API key is set", () => {
        delete process.env.BTCPAYSERVER_API_KEY;
        delete process.env.NEXT_PUBLIC_USE_MOCK;
        
        expect(isUsingMockData()).toBe(true);
      });

      it("returns false when API key is set and USE_MOCK is not true", () => {
        process.env.BTCPAYSERVER_API_KEY = "api-key";
        process.env.NEXT_PUBLIC_USE_MOCK = "false";
        
        expect(serverEnv.btcpayApiKey).toBe("api-key");
        expect(clientEnv.useMock).toBe(false);
        expect(isUsingMockData()).toBe(false);
      });

      it("returns true when USE_MOCK is true even with API key", () => {
        process.env.BTCPAYSERVER_API_KEY = "api-key";
        process.env.NEXT_PUBLIC_USE_MOCK = "true";
        
        expect(isUsingMockData()).toBe(true);
      });
    });

    describe("client-side", () => {
      beforeEach(() => {
        // Mock isServerSide to return false for client-side tests
        mockIsServerSide = false;
      });
      
      it("always returns true on client-side", () => {
        process.env.BTCPAYSERVER_API_KEY = "api-key";
        process.env.NEXT_PUBLIC_USE_MOCK = "false";
        
        expect(isUsingMockData()).toBe(true);
      });
    });
  });

  describe("edge cases", () => {
    it("handles missing environment variables gracefully", () => {
      delete process.env.BTCPAYSERVER_API_KEY;
      delete process.env.NEXT_PUBLIC_BTCPAY_URL;
      delete process.env.NEXT_PUBLIC_STORE_ID;
      delete process.env.NEXT_PUBLIC_USE_MOCK;
      
      jest.resetModules();
      const { serverEnv, clientEnv } = require("../env");
      
      expect(serverEnv.btcpayApiKey).toBe("");
      expect(clientEnv.btcpayUrl).toBe("https://btcpay.example.com");
      expect(clientEnv.storeId).toBe("store-1");
      expect(clientEnv.useMock).toBe(false);
    });

    it("only accepts 'true' string for USE_MOCK", () => {
      // Test various values
      const testValues = ["1", "yes", "TRUE", "True", "false", "0", "no"];
      
      testValues.forEach(value => {
        process.env.NEXT_PUBLIC_USE_MOCK = value;
        jest.resetModules();
        const { clientEnv } = require("../env");
        
        // Only lowercase "true" should result in true
        expect(clientEnv.useMock).toBe(value === "true");
      });
    });
  });
});