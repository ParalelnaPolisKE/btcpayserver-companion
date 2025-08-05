export interface CheckedInTicket {
  id?: number;
  invoiceId: string;
  orderId?: string;
  checkedInAt: Date;
  eventId?: string;
  metadata?: Record<string, any>;
}

class CheckInDatabase {
  private dbName = 'EventCheckInDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('checkedInTickets')) {
          const store = db.createObjectStore('checkedInTickets', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          
          store.createIndex('invoiceId', 'invoiceId', { unique: false });
          store.createIndex('orderId', 'orderId', { unique: false });
          store.createIndex('eventId', 'eventId', { unique: false });
          store.createIndex('checkedInAt', 'checkedInAt', { unique: false });
        }
      };
    });
  }

  async addCheckIn(ticket: Omit<CheckedInTicket, 'id'>): Promise<number> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['checkedInTickets'], 'readwrite');
      const store = transaction.objectStore('checkedInTickets');
      
      const request = store.add(ticket);
      
      request.onsuccess = () => {
        resolve(request.result as number);
      };
      
      request.onerror = () => {
        reject(new Error('Failed to add check-in'));
      };
    });
  }

  async getCheckIn(invoiceId: string): Promise<CheckedInTicket | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['checkedInTickets'], 'readonly');
      const store = transaction.objectStore('checkedInTickets');
      const index = store.index('invoiceId');
      
      const request = index.get(invoiceId);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        reject(new Error('Failed to get check-in'));
      };
    });
  }

  async getAllCheckIns(eventId?: string): Promise<CheckedInTicket[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['checkedInTickets'], 'readonly');
      const store = transaction.objectStore('checkedInTickets');
      
      let request: IDBRequest;
      
      if (eventId) {
        const index = store.index('eventId');
        request = index.getAll(eventId);
      } else {
        request = store.getAll();
      }
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = () => {
        reject(new Error('Failed to get check-ins'));
      };
    });
  }

  async removeCheckIn(invoiceId: string): Promise<void> {
    if (!this.db) await this.init();
    
    const checkIn = await this.getCheckIn(invoiceId);
    if (!checkIn || !checkIn.id) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['checkedInTickets'], 'readwrite');
      const store = transaction.objectStore('checkedInTickets');
      
      const request = store.delete(checkIn.id);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(new Error('Failed to remove check-in'));
      };
    });
  }

  async clearAllCheckIns(): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['checkedInTickets'], 'readwrite');
      const store = transaction.objectStore('checkedInTickets');
      
      const request = store.clear();
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(new Error('Failed to clear check-ins'));
      };
    });
  }

  async getStats(eventId?: string): Promise<{ total: number; today: number; }> {
    const checkIns = await this.getAllCheckIns(eventId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayCheckIns = checkIns.filter(checkIn => {
      const checkInDate = new Date(checkIn.checkedInAt);
      checkInDate.setHours(0, 0, 0, 0);
      return checkInDate.getTime() === today.getTime();
    });
    
    return {
      total: checkIns.length,
      today: todayCheckIns.length
    };
  }
}

export const checkInDB = new CheckInDatabase();