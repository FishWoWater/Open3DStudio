/**
 * IndexedDB Storage Service
 * Replaces localStorage for large 3D assets (supports 50MB+ per asset)
 * Uses browser's native IndexedDB API (no external dependencies)
 */

export interface StoredAsset {
  id: string;
  name: string;
  type: 'glb' | 'gltf' | 'obj' | 'fbx' | 'texture';
  data: ArrayBuffer;
  metadata: {
    size: number;
    createdAt: Date;
    projectId?: string;
    tags?: string[];
  };
}

export interface StoredProject {
  id: string;
  data: any;
  timestamp: Date;
}

class IndexedDBStorage {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'Open3DStudio';
  private readonly DB_VERSION = 1;

  /**
   * Initialize the database
   */
  async init(): Promise<void> {
    if (this.db) return; // Already initialized

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB failed to open:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('assets')) {
          const assetStore = db.createObjectStore('assets', { keyPath: 'id' });
          assetStore.createIndex('type', 'type', { unique: false });
          assetStore.createIndex('projectId', 'metadata.projectId', { unique: false });
          console.log('Created "assets" object store');
        }

        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
          console.log('Created "projects" object store');
        }

        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('Created "cache" object store');
        }
      };
    });
  }

  /**
   * Save a 3D asset to IndexedDB
   */
  async saveAsset(asset: StoredAsset): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['assets'], 'readwrite');
      const store = transaction.objectStore('assets');
      const request = store.put(asset);

      request.onsuccess = () => {
        console.log(`Asset saved: ${asset.name} (${this.formatBytes(asset.metadata.size)})`);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to save asset:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get a 3D asset from IndexedDB
   */
  async getAsset(id: string): Promise<StoredAsset | null> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['assets'], 'readonly');
      const store = transaction.objectStore('assets');
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        console.error('Failed to get asset:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all assets (optionally filtered by project)
   */
  async getAllAssets(projectId?: string): Promise<StoredAsset[]> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['assets'], 'readonly');
      const store = transaction.objectStore('assets');

      let request: IDBRequest;

      if (projectId) {
        const index = store.index('projectId');
        request = index.getAll(projectId);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error('Failed to get assets:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete an asset
   */
  async deleteAsset(id: string): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['assets'], 'readwrite');
      const store = transaction.objectStore('assets');
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log(`Asset deleted: ${id}`);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to delete asset:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Save project data
   */
  async saveProject(id: string, data: any): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');
      const request = store.put({
        id,
        data,
        timestamp: new Date()
      });

      request.onsuccess = () => {
        console.log(`Project saved: ${id}`);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to save project:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get project data
   */
  async getProject(id: string): Promise<any | null> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['projects'], 'readonly');
      const store = transaction.objectStore('projects');
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };

      request.onerror = () => {
        console.error('Failed to get project:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Cache arbitrary data with TTL
   */
  async setCache(key: string, value: any, ttlMinutes: number = 60): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.put({
        key,
        value,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttlMinutes * 60 * 1000
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get cached data
   */
  async getCache(key: string): Promise<any | null> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }

        // Check if expired
        if (result.expiresAt < Date.now()) {
          // Clean up expired entry
          this.deleteCache(key);
          resolve(null);
          return;
        }

        resolve(result.value);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete cached data
   */
  async deleteCache(key: string): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    assetCount: number;
    totalSize: number;
    projectCount: number;
  }> {
    await this.ensureInitialized();

    const assets = await this.getAllAssets();
    const totalSize = assets.reduce((sum, asset) => sum + asset.metadata.size, 0);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['projects'], 'readonly');
      const store = transaction.objectStore('projects');
      const request = store.count();

      request.onsuccess = () => {
        resolve({
          assetCount: assets.length,
          totalSize,
          projectCount: request.result
        });
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all data (use with caution!)
   */
  async clearAll(): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['assets', 'projects', 'cache'], 'readwrite');

      transaction.objectStore('assets').clear();
      transaction.objectStore('projects').clear();
      transaction.objectStore('cache').clear();

      transaction.oncomplete = () => {
        console.log('All IndexedDB data cleared');
        resolve();
      };

      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Ensure database is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.db) {
      await this.init();
    }
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// Export singleton instance
export const indexedDBStorage = new IndexedDBStorage();

// Initialize on import (in browser environment)
if (typeof window !== 'undefined') {
  indexedDBStorage.init().catch(error => {
    console.error('Failed to initialize IndexedDB:', error);
    console.warn('Falling back to localStorage (limited capacity)');
  });
}
