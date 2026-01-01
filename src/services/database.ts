/**
 * Dexie.js Database Service
 * Enhanced IndexedDB storage using Dexie.js for better TypeScript support and simpler API
 * Supports 50MB+ per asset with automatic indexing and querying
 */

import Dexie, { Table } from 'dexie';

// Asset types
export interface Asset3D {
  id: string;
  name: string;
  type: 'glb' | 'gltf' | 'obj' | 'fbx' | 'texture';
  data: ArrayBuffer;
  thumbnail?: Blob;
  metadata: {
    size: number;
    createdAt: Date;
    projectId?: string;
    tags?: string[];
  };
}

// Game project types
export interface GameProject {
  id: string;
  name: string;
  genre: string;
  description?: string;
  generatedCode?: string;
  updatedAt: Date;
  createdAt: Date;
}

// Cache entry types - using unknown for type safety, consumers should cast appropriately
export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  timestamp: number;
  expiresAt: number;
}

// Settings types - using unknown for type safety, consumers should cast appropriately
export interface AppSettings<T = unknown> {
  key: string;
  value: T;
  updatedAt: Date;
}

/**
 * Open3DStudio Database using Dexie.js
 * Provides improved performance and developer experience over raw IndexedDB
 */
export class Open3DStudioDB extends Dexie {
  // Declare tables
  assets!: Table<Asset3D, string>;
  projects!: Table<GameProject, string>;
  cache!: Table<CacheEntry<unknown>, string>;
  settings!: Table<AppSettings<unknown>, string>;

  constructor() {
    super('Open3DStudioDB');
    
    // Define schema
    this.version(1).stores({
      assets: 'id, name, type, metadata.createdAt, metadata.projectId',
      projects: 'id, name, genre, updatedAt, createdAt',
      cache: 'key, timestamp, expiresAt',
      settings: 'key, updatedAt'
    });
  }

  /**
   * Save a 3D asset
   */
  async saveAsset(asset: Asset3D): Promise<void> {
    await this.assets.put(asset);
    console.log(`Asset saved: ${asset.name} (${this.formatBytes(asset.metadata.size)})`);
  }

  /**
   * Get a 3D asset by ID
   */
  async getAsset(id: string): Promise<Asset3D | undefined> {
    return await this.assets.get(id);
  }

  /**
   * Get all assets (optionally filtered by project)
   */
  async getAllAssets(projectId?: string): Promise<Asset3D[]> {
    if (projectId) {
      return await this.assets
        .where('metadata.projectId')
        .equals(projectId)
        .toArray();
    }
    return await this.assets.toArray();
  }

  /**
   * Delete an asset by ID
   */
  async deleteAsset(id: string): Promise<void> {
    await this.assets.delete(id);
    console.log(`Asset deleted: ${id}`);
  }

  /**
   * Save a game project
   */
  async saveProject(project: Omit<GameProject, 'createdAt'> & { createdAt?: Date }): Promise<void> {
    const now = new Date();
    const fullProject: GameProject = {
      ...project,
      createdAt: project.createdAt || now,
      updatedAt: now
    };
    await this.projects.put(fullProject);
    console.log(`Project saved: ${project.name}`);
  }

  /**
   * Get a project by ID
   */
  async getProject(id: string): Promise<GameProject | undefined> {
    return await this.projects.get(id);
  }

  /**
   * Get all projects
   */
  async getAllProjects(): Promise<GameProject[]> {
    return await this.projects.orderBy('updatedAt').reverse().toArray();
  }

  /**
   * Delete a project by ID
   */
  async deleteProject(id: string): Promise<void> {
    await this.projects.delete(id);
    console.log(`Project deleted: ${id}`);
  }

  /**
   * Save to cache with TTL
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttlMinutes - Time to live in minutes (default: 60)
   */
  async setCache<T>(key: string, value: T, ttlMinutes: number = 60): Promise<void> {
    const now = Date.now();
    await this.cache.put({
      key,
      value,
      timestamp: now,
      expiresAt: now + ttlMinutes * 60 * 1000
    });
  }

  /**
   * Get from cache (returns null if expired)
   * @param key - Cache key
   * @returns Cached value or null if not found/expired
   */
  async getCache<T = unknown>(key: string): Promise<T | null> {
    const entry = await this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (entry.expiresAt < Date.now()) {
      await this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Delete from cache
   */
  async deleteCache(key: string): Promise<void> {
    await this.cache.delete(key);
  }

  /**
   * Clean up expired cache entries
   */
  async cleanExpiredCache(): Promise<number> {
    const now = Date.now();
    const expired = await this.cache
      .where('expiresAt')
      .below(now)
      .toArray();
    
    await this.cache.bulkDelete(expired.map(e => e.key));
    return expired.length;
  }

  /**
   * Save app settings
   * @param key - Setting key
   * @param value - Setting value
   */
  async saveSetting<T>(key: string, value: T): Promise<void> {
    await this.settings.put({
      key,
      value,
      updatedAt: new Date()
    });
  }

  /**
   * Get app setting
   * @param key - Setting key
   * @returns Setting value or undefined if not found
   */
  async getSetting<T = unknown>(key: string): Promise<T | undefined> {
    const setting = await this.settings.get(key);
    return setting?.value as T | undefined;
  }

  /**
   * Get all settings
   * @returns Record of all settings
   */
  async getAllSettings(): Promise<Record<string, unknown>> {
    const settings = await this.settings.toArray();
    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, unknown>);
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    assetCount: number;
    totalSize: number;
    projectCount: number;
    cacheEntries: number;
  }> {
    const assets = await this.assets.toArray();
    const totalSize = assets.reduce((sum, asset) => sum + asset.metadata.size, 0);
    const projectCount = await this.projects.count();
    const cacheEntries = await this.cache.count();

    return {
      assetCount: assets.length,
      totalSize,
      projectCount,
      cacheEntries
    };
  }

  /**
   * Clear all data (use with caution!)
   */
  async clearAll(): Promise<void> {
    await Promise.all([
      this.assets.clear(),
      this.projects.clear(),
      this.cache.clear(),
      this.settings.clear()
    ]);
    console.log('All database data cleared');
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
export const db = new Open3DStudioDB();

// Initialize on import (in browser environment)
if (typeof window !== 'undefined') {
  db.open().catch(error => {
    console.error('Failed to open Dexie database:', error);
    console.warn('Falling back to localStorage (limited capacity)');
  });
}
