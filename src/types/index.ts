export interface BTCPayConfig {
  serverUrl: string;
  apiKey: string;
  storeId: string;
}

export interface ValidationError {
  field: string;
  message: string;
}