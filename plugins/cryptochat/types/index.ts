/**
 * Type definitions for CryptoChat plugin
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sources?: MessageSource[];
}

export interface MessageSource {
  id: string;
  type: 'invoice' | 'payment' | 'store' | 'app';
  relevance: number;
  metadata?: Record<string, any>;
}

export interface CryptoChatSettings {
  provider: 'openai' | 'ollama';
  openaiApiKey?: string;
  ollamaUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  enableRAG?: boolean;
  maxSources?: number;
  embeddingModel?: string;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata: any;
}

export interface EmbeddingResponse {
  embedding: number[];
  tokens: number;
}

export interface IndexingProgress {
  current: number;
  total: number;
  status: 'idle' | 'indexing' | 'completed' | 'error';
  message?: string;
}