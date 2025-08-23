/**
 * Local vector database implementation for CryptoChat plugin
 * Uses IndexedDB for storage and implements vector similarity search
 */

interface VectorDocument {
  id: string;
  vector: number[];
  metadata: any;
}

export class LocalVectorDB {
  private dbName: string;
  private storeName: string;
  private dimensions: number;
  private db: IDBDatabase | null = null;

  constructor(config: {
    dbName: string;
    storeName: string;
    dimensions: number;
  }) {
    this.dbName = config.dbName;
    this.storeName = config.storeName;
    this.dimensions = config.dimensions;
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('id', 'id', { unique: true });
        }
      };
    });
  }

  async add(doc: VectorDocument): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(doc);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async search(queryVector: number[], k: number = 5): Promise<VectorDocument[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const documents = request.result as VectorDocument[];
        
        // Calculate cosine similarity for each document
        const similarities = documents.map(doc => ({
          ...doc,
          similarity: this.cosineSimilarity(queryVector, doc.vector)
        }));

        // Sort by similarity and return top k
        similarities.sort((a, b) => b.similarity - a.similarity);
        resolve(similarities.slice(0, k));
      };

      request.onerror = () => reject(request.error);
    });
  }

  async clear(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async count(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      // Pad the shorter vector with zeros
      const maxLength = Math.max(vecA.length, vecB.length);
      while (vecA.length < maxLength) vecA.push(0);
      while (vecB.length < maxLength) vecB.push(0);
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (normA * normB);
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Singleton instance for the plugin
let vectorDBInstance: LocalVectorDB | null = null;

/**
 * Initialize the vector database for the CryptoChat plugin
 */
export async function initVectorDB(): Promise<LocalVectorDB> {
  if (!vectorDBInstance) {
    vectorDBInstance = new LocalVectorDB({
      dbName: 'cryptochat-vectors',
      storeName: 'embeddings',
      dimensions: 1536 // Default for OpenAI embeddings
    });
    await vectorDBInstance.init();
  }
  return vectorDBInstance;
}

/**
 * Get the current vector DB instance
 */
export function getVectorDB(): LocalVectorDB | null {
  return vectorDBInstance;
}

/**
 * Close and cleanup the vector DB
 */
export async function closeVectorDB(): Promise<void> {
  if (vectorDBInstance) {
    await vectorDBInstance.close();
    vectorDBInstance = null;
  }
}