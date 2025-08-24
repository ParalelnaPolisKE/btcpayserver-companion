import CryptoJS from "crypto-js";

/**
 * Encryption utility for sensitive data in IndexedDB
 * Uses AES encryption with a derived key from browser fingerprint
 */
export class CryptoService {
  private encryptionKey: string;

  constructor() {
    // Generate a unique encryption key based on browser fingerprint
    // In production, consider using Web Crypto API for key derivation
    this.encryptionKey = this.generateEncryptionKey();
  }

  /**
   * Generate encryption key from browser fingerprint
   * This provides a consistent key per browser/device
   */
  private generateEncryptionKey(): string {
    // Combine multiple browser properties for fingerprinting
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      navigator.platform,
      navigator.hardwareConcurrency?.toString() || "unknown",
      new Date().getTimezoneOffset().toString(),
      screen.width.toString(),
      screen.height.toString(),
      screen.colorDepth.toString(),
      // Add a salt for additional security
      "BTCPayCompanion-v1",
    ].join("|");

    // Generate SHA-256 hash as the encryption key
    return CryptoJS.SHA256(fingerprint).toString();
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(data: any): string {
    try {
      const jsonString = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonString, this.encryptionKey);
      return encrypted.toString();
    } catch (error) {
      console.error("Encryption failed:", error);
      throw new Error("Failed to encrypt data");
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt<T = any>(encryptedData: string): T {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);

      if (!jsonString) {
        throw new Error("Decryption resulted in empty string");
      }

      return JSON.parse(jsonString);
    } catch (error) {
      console.error("Decryption failed:", error);
      throw new Error("Failed to decrypt data");
    }
  }

  /**
   * Check if a value is encrypted (simple heuristic check)
   */
  isEncrypted(value: any): boolean {
    if (typeof value !== "string") return false;

    // Check if it looks like an AES encrypted string
    // CryptoJS AES output format: "U2FsdGVkX1..."
    return value.startsWith("U2FsdGVkX1") && value.length > 20;
  }

  /**
   * Encrypt only specific fields in an object
   */
  encryptFields<T extends Record<string, any>>(
    obj: T,
    fieldsToEncrypt: (keyof T)[],
  ): T {
    const result = { ...obj };

    for (const field of fieldsToEncrypt) {
      if (field in result && result[field] !== undefined) {
        result[field] = this.encrypt(result[field]) as any;
      }
    }

    return result;
  }

  /**
   * Decrypt only specific fields in an object
   */
  decryptFields<T extends Record<string, any>>(
    obj: T,
    fieldsToDecrypt: (keyof T)[],
  ): T {
    const result = { ...obj };

    for (const field of fieldsToDecrypt) {
      if (field in result && this.isEncrypted(result[field])) {
        try {
          result[field] = this.decrypt(result[field] as string);
        } catch (error) {
          console.error(`Failed to decrypt field ${String(field)}:`, error);
          // Keep the original value if decryption fails
        }
      }
    }

    return result;
  }

  /**
   * Generate a secure random token
   */
  generateSecureToken(length = 32): string {
    return CryptoJS.lib.WordArray.random(length).toString();
  }

  /**
   * Hash sensitive data (one-way, for comparison)
   */
  hash(data: string): string {
    return CryptoJS.SHA256(data).toString();
  }

  /**
   * Verify if a plain text matches a hash
   */
  verifyHash(plainText: string, hash: string): boolean {
    return this.hash(plainText) === hash;
  }
}

// Singleton instance
let cryptoInstance: CryptoService | null = null;

export const getCryptoService = (): CryptoService => {
  if (!cryptoInstance) {
    cryptoInstance = new CryptoService();
  }
  return cryptoInstance;
};

// Define which fields should be encrypted for each data type
export const ENCRYPTED_FIELDS = {
  settings: ["apiKey", "serverUrl", "webhookSecret"],
  plugins: ["config.settings.apiKey", "config.settings.secret"],
  stores: ["posFilter"],
} as const;
