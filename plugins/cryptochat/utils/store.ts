// Local storage for CryptoChat settings
const STORAGE_KEY = 'cryptochat-settings';

export type AIProvider = 'openai' | 'ollama';

export interface CryptoChatSettings {
  provider?: AIProvider;
  // OpenAI settings
  openaiApiKey?: string;
  openaiModel?: string;
  // Ollama settings
  ollamaUrl?: string;
  ollamaModel?: string;
  // Common settings
  temperature?: number;
  maxTokens?: number;
}

export const DEFAULT_SETTINGS: CryptoChatSettings = {
  provider: 'openai',
  openaiModel: 'gpt-3.5-turbo',
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'llama2',
  temperature: 0.7,
  maxTokens: 1000,
};

export function getCryptoChatSettings(): CryptoChatSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to load CryptoChat settings:', error);
  }
  
  return DEFAULT_SETTINGS;
}

export function saveCryptoChatSettings(settings: CryptoChatSettings): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save CryptoChat settings:', error);
  }
}

export function clearCryptoChatSettings(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear CryptoChat settings:', error);
  }
}