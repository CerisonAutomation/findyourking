// IndexedDB implementation for offline data persistence
class OfflineStorage {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'fyking-offline';
  private readonly dbVersion = 1;

  async init(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        if (!event.target) return
        const db = (event.target as IDBOpenDBRequest).result;

        // Profiles store
        if (!db.objectStoreNames.contains('profiles')) {
          const profilesStore = db.createObjectStore('profiles', { keyPath: 'userId' });
          profilesStore.createIndex('id', 'id', { unique: false });
          profilesStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Messages store
        if (!db.objectStoreNames.contains('messages')) {
          const messagesStore = db.createObjectStore('messages', { keyPath: 'id' });
          messagesStore.createIndex('conversationId', 'conversationId', { unique: false });
          messagesStore.createIndex('senderId', 'senderId', { unique: false });
          messagesStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Favorites store
        if (!db.objectStoreNames.contains('favorites')) {
          const favoritesStore = db.createObjectStore('favorites', { keyPath: 'id' });
          favoritesStore.createIndex('userId', 'userId', { unique: false });
          favoritesStore.createIndex('favoritedUserId', 'favoritedUserId', { unique: false });
        }

        // Conversations store
        if (!db.objectStoreNames.contains('conversations')) {
          const conversationsStore = db.createObjectStore('conversations', { keyPath: 'id' });
          conversationsStore.createIndex('participant1Id', 'participant1Id', { unique: false });
          conversationsStore.createIndex('participant2Id', 'participant2Id', { unique: false });
          conversationsStore.createIndex('lastMessageAt', 'lastMessageAt', { unique: false });
        }

        // Sync queue store for pending operations
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  // Generic CRUD operations
  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  // Profiles operations
  async saveProfile(profile: any): Promise<void> {
    const store = await this.getStore('profiles', 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = store.put({ ...profile, cachedAt: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getProfile(userId: string): Promise<any | null> {
    const store = await this.getStore('profiles');
    return new Promise<any>((resolve, reject) => {
      const request = store.get(userId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllProfiles(): Promise<any[]> {
    const store = await this.getStore('profiles');
    return new Promise<any[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Messages operations
  async saveMessage(message: any): Promise<void> {
    const store = await this.getStore('messages', 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = store.put({ ...message, cachedAt: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getMessages(conversationId: string, limit: number = 50): Promise<any[]> {
    const store = await this.getStore('messages');
    return new Promise<any[]>((resolve, reject) => {
      const index = store.index('conversationId');
      const request = index.getAll(conversationId);
      request.onsuccess = () => {
        const messages = request.result || [];
        // Sort by createdAt descending and limit
        messages.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(messages.slice(0, limit));
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Favorites operations
  async saveFavorite(favorite: any): Promise<void> {
    const store = await this.getStore('favorites', 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = store.put({ ...favorite, cachedAt: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async removeFavorite(userId: string, favoritedUserId: string): Promise<void> {
    const store = await this.getStore('favorites', 'readwrite');
    return new Promise<void>((resolve, reject) => {
      const index = store.index('userId');
      const request = index.openCursor();
      request.onsuccess = (event) => {
        if (!event.target) return;
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          if (cursor.value.userId === userId && cursor.value.favoritedUserId === favoritedUserId) {
            cursor.delete();
            resolve();
            return;
          }
          cursor.continue();
        } else {
          resolve(); // Not found, still resolve
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getFavorites(userId: string): Promise<any[]> {
    const store = await this.getStore('favorites');
    return new Promise<any[]>((resolve, reject) => {
      const index = store.index('userId');
      const request = index.getAll(userId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Conversations operations
  async saveConversation(conversation: any): Promise<void> {
    const store = await this.getStore('conversations', 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = store.put({ ...conversation, cachedAt: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getConversations(userId: string): Promise<any[]> {
    const store = await this.getStore('conversations');
    return new Promise<any[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const conversations = request.result || [];
        // Filter conversations where user is a participant
        const userConversations = conversations.filter(conv =>
          conv.participant1Id === userId || conv.participant2Id === userId
        );
        // Sort by lastMessageAt descending
        userConversations.sort((a: any, b: any) =>
          new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
        );
        resolve(userConversations);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Sync queue operations
  async addToSyncQueue(operation: any): Promise<void> {
    const store = await this.getStore('syncQueue', 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = store.add({
        ...operation,
        timestamp: Date.now(),
        retries: 0
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncQueue(): Promise<any[]> {
    const store = await this.getStore('syncQueue');
    return new Promise<any[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async removeFromSyncQueue(id: number): Promise<void> {
    const store = await this.getStore('syncQueue', 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Clear all data (for logout/reset)
  async clear(): Promise<void> {
    if (!this.db) return;

    const storeNames = Array.from(this.db.objectStoreNames);
    const transaction = this.db.transaction(storeNames, 'readwrite');

    await Promise.all(
      storeNames.map(storeName => {
        return new Promise<void>((resolve, reject) => {
          const request = transaction.objectStore(storeName).clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      })
    );
  }

  // Check if we're online
  isOnline(): boolean {
    return navigator.onLine;
  }

  // Sync mechanism
  async syncWithServer(): Promise<void> {
    if (!this.isOnline()) return;

    const syncQueue = await this.getSyncQueue();

    for (const operation of syncQueue) {
      try {
        // Implement sync logic based on operation type
        // This would integrate with your API endpoints
        await this.processSyncOperation(operation);
        await this.removeFromSyncQueue(operation.id);
      } catch (error) {
        console.error('Sync operation failed:', error);
        // Increment retry count, implement exponential backoff
        operation.retries = (operation.retries || 0) + 1;
        if (operation.retries < 3) {
          // Update retry count in queue
          await this.updateSyncOperation(operation);
        } else {
          // Remove after max retries
          await this.removeFromSyncQueue(operation.id);
        }
      }
    }
  }

  private async processSyncOperation(operation: any): Promise<void> {
    // Implement based on operation type
    // This would call your API endpoints
    switch (operation.type) {
      case 'save_message':
        // Call API to save message
        break;
      case 'add_favorite':
        // Call API to add favorite
        break;
      case 'remove_favorite':
        // Call API to remove favorite
        break;
      default:
        throw new Error(`Unknown sync operation: ${operation.type}`);
    }
  }

  private async updateSyncOperation(operation: any): Promise<void> {
    const store = await this.getStore('syncQueue', 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = store.put(operation);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorage();