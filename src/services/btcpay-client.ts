import axios, { type AxiosInstance } from "axios";
import type { BTCPayConfig } from "@/types";

export class BTCPayClient {
  private client: AxiosInstance;
  protected storeId: string;

  constructor(config: BTCPayConfig) {
    this.storeId = config.storeId;
    this.client = axios.create({
      baseURL: config.serverUrl,
      headers: {
        Authorization: `token ${config.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor for debugging
    this.client.interceptors.request.use(
      (config) => {
        console.log("BTCPay API Request:", {
          url: config.url,
          method: config.method,
          headers: {
            ...config.headers,
            Authorization: config.headers.Authorization
              ? `token ${String(config.headers.Authorization).substring(6, 10)}...`
              : "none",
          },
        });
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );
  }

  /**
   * Verify the API connection and permissions
   */
  async verifyConnection(): Promise<boolean> {
    try {
      const response = await this.client.get(`/api/v1/stores/${this.storeId}`);
      return response.status === 200;
    } catch (error) {
      console.error("Failed to verify BTCPay connection:", error);
      return false;
    }
  }

  /**
   * Get all stores accessible with the current API key
   */
  async getAvailableStores(): Promise<
    Array<{ id: string; name: string; website?: string; archived: boolean }>
  > {
    try {
      const response = await this.client.get("/api/v1/stores");
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch available stores:", error);
      return [];
    }
  }

  /**
   * Get Point of Sale apps for a specific store
   */
  async getStorePOSApps(
    storeId: string,
  ): Promise<
    Array<{ id: string; appName: string; title: string; items?: any[] }>
  > {
    try {
      const response = await this.client.get(`/api/v1/stores/${storeId}/apps`);
      // Filter for POS apps only
      const posApps =
        response.data?.filter((app: any) => app.appType === "PointOfSale") ||
        [];
      return posApps;
    } catch (error) {
      console.error("Failed to fetch POS apps:", error);
      return [];
    }
  }

  /**
   * Get invoices for analytics with pagination
   */
  async getInvoices(params?: {
    skip?: number;
    take?: number;
    startDate?: string | number;
    endDate?: string | number;
    status?: string[];
    searchTerm?: string;
  }) {
    try {
      const queryParams = new URLSearchParams();
      if (params?.skip) queryParams.append("skip", params.skip.toString());
      if (params?.take) queryParams.append("take", params.take.toString());

      // Convert dates to Unix timestamps if they're ISO strings
      if (params?.startDate) {
        const timestamp =
          typeof params.startDate === "string"
            ? Math.floor(new Date(params.startDate).getTime() / 1000)
            : params.startDate;
        queryParams.append("startDate", timestamp.toString());
      }
      if (params?.endDate) {
        const timestamp =
          typeof params.endDate === "string"
            ? Math.floor(new Date(params.endDate).getTime() / 1000)
            : params.endDate;
        queryParams.append("endDate", timestamp.toString());
      }

      if (params?.status) {
        params.status.forEach((s) => queryParams.append("status", s));
      }
      if (params?.searchTerm)
        queryParams.append("searchTerm", params.searchTerm);

      const response = await this.client.get(
        `/api/v1/stores/${this.storeId}/invoices?${queryParams.toString()}`,
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Failed to fetch invoices:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
        });
      }
      console.error("Failed to fetch invoices:", error);
      throw error;
    }
  }

  /**
   * Get store information including supported payment methods
   */
  async getStoreInfo() {
    try {
      const response = await this.client.get(`/api/v1/stores/${this.storeId}`);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch store info:", error);
      throw error;
    }
  }

  /**
   * Get payment methods for the store
   */
  async getPaymentMethods() {
    try {
      const response = await this.client.get(
        `/api/v1/stores/${this.storeId}/payment-methods`,
      );
      return response.data;
    } catch (error) {
      console.error("Failed to fetch payment methods:", error);
      throw error;
    }
  }

  /**
   * Get invoice details by ID
   */
  async getInvoiceById(invoiceId: string) {
    try {
      const response = await this.client.get(
        `/api/v1/stores/${this.storeId}/invoices/${invoiceId}`,
      );
      return response.data;
    } catch (error) {
      console.error("Failed to fetch invoice details:", error);
      throw error;
    }
  }
}
