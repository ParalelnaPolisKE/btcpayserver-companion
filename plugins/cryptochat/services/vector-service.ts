import { LocalVectorDB } from '../utils/vector-db';
import { getCryptoChatSettings } from '../utils/store';

export interface Document {
  id: string;
  content: string;
  metadata: {
    type: 'invoice' | 'payment' | 'store' | 'app' | 'customer';
    entityId: string;
    timestamp?: number;
    amount?: number;
    currency?: string;
    status?: string;
    [key: string]: any;
  };
  embedding?: number[];
}

export class VectorService {
  private store: LocalVectorDB | null = null;
  private readonly dbName = 'cryptochat-vectors';
  private readonly storeName = 'btcpay-documents';

  async initialize(): Promise<void> {
    try {
      this.store = new LocalVectorDB({
        dbName: this.dbName,
        storeName: this.storeName,
        dimensions: 1536, // OpenAI embedding dimensions
      });
      await this.store.init();
      console.log('Vector store initialized');
    } catch (error) {
      console.error('Failed to initialize vector store:', error);
      throw error;
    }
  }

  async addDocument(doc: Document): Promise<void> {
    if (!this.store) {
      throw new Error('Vector store not initialized');
    }

    // Generate embedding for the document
    const embedding = await this.generateEmbedding(doc.content);
    
    await this.store.add({
      id: doc.id,
      vector: embedding,
      metadata: {
        content: doc.content,
        ...doc.metadata,
      },
    });
  }

  async addDocuments(docs: Document[]): Promise<void> {
    for (const doc of docs) {
      await this.addDocument(doc);
    }
  }

  async search(query: string, k: number = 5): Promise<Document[]> {
    if (!this.store) {
      throw new Error('Vector store not initialized');
    }

    const queryEmbedding = await this.generateEmbedding(query);
    const results = await this.store.search(queryEmbedding, k);

    return results.map(result => ({
      id: result.id,
      content: result.metadata.content,
      metadata: result.metadata,
      embedding: result.vector,
    }));
  }

  async clearAll(): Promise<void> {
    if (!this.store) {
      throw new Error('Vector store not initialized');
    }

    // Clear all documents from the store
    await this.store.clear();
  }

  async getDocumentCount(): Promise<number> {
    if (!this.store) {
      throw new Error('Vector store not initialized');
    }

    return await this.store.count();
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const settings = getCryptoChatSettings();
    
    // Use Ollama embeddings if configured
    if (settings.provider === 'ollama') {
      return this.generateOllamaEmbedding(text);
    }
    
    // Use OpenAI embeddings if API key is available
    if (settings.openaiApiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.openaiApiKey}`,
          },
          body: JSON.stringify({
            model: 'text-embedding-ada-002',
            input: text,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate embedding');
        }

        const data = await response.json();
        return data.data[0].embedding;
      } catch (error) {
        console.error('Failed to generate OpenAI embedding:', error);
        // Fall back to mock embeddings
      }
    }

    // Mock embedding generation for development
    return this.generateMockEmbedding(text);
  }

  private async generateOllamaEmbedding(text: string): Promise<number[]> {
    const settings = getCryptoChatSettings();
    const ollamaUrl = settings.ollamaUrl || 'http://localhost:11434';
    const model = settings.ollamaModel || 'llama2';

    try {
      // Ollama's embedding API
      const response = await fetch(`${ollamaUrl}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt: text,
        }),
      });

      if (!response.ok) {
        // Fall back to generating embeddings via completion API
        // This is less efficient but works with all Ollama models
        return this.generateOllamaEmbeddingViaCompletion(text);
      }

      const data = await response.json();
      
      // Ensure we have 1536 dimensions (pad or truncate as needed)
      const embedding = data.embedding || [];
      const normalizedEmbedding = new Array(1536).fill(0);
      
      for (let i = 0; i < Math.min(embedding.length, 1536); i++) {
        normalizedEmbedding[i] = embedding[i];
      }
      
      // Normalize the vector
      const norm = Math.sqrt(normalizedEmbedding.reduce((sum, val) => sum + val * val, 0));
      return normalizedEmbedding.map(val => val / (norm || 1));
    } catch (error) {
      console.error('Failed to generate Ollama embedding:', error);
      // Fall back to mock embeddings
      return this.generateMockEmbedding(text);
    }
  }

  private async generateOllamaEmbeddingViaCompletion(text: string): Promise<number[]> {
    // Generate a deterministic embedding based on the text
    // This is a fallback when Ollama doesn't support embeddings endpoint
    // In production, you should use a model that supports embeddings
    
    const settings = getCryptoChatSettings();
    const ollamaUrl = settings.ollamaUrl || 'http://localhost:11434';
    const model = settings.ollamaModel || 'llama2';

    try {
      // Use the model to generate a short summary/description
      // This gives us semantic information about the text
      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt: `Summarize this in 5 words: ${text.substring(0, 500)}`,
          temperature: 0.1,
          max_tokens: 20,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate completion');
      }

      const data = await response.json();
      const summary = data.response || text;
      
      // Generate embedding from the summary + original text
      return this.generateMockEmbedding(text + ' ' + summary);
    } catch (error) {
      console.error('Failed to generate Ollama embedding via completion:', error);
      return this.generateMockEmbedding(text);
    }
  }

  private generateMockEmbedding(text: string): number[] {
    // Simple mock embedding based on text hash
    const hash = this.hashString(text);
    const embedding = new Array(1536).fill(0);
    
    for (let i = 0; i < embedding.length; i++) {
      // Generate deterministic pseudo-random values based on hash and position
      const seed = hash + i;
      embedding[i] = (Math.sin(seed) * Math.cos(seed * 2) + Math.sin(seed * 3)) / 3;
    }
    
    // Normalize the vector
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / norm);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}