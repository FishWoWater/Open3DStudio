import { AppSettings } from '../types/state';

const STORAGE_KEY = 'minimal3d_settings';
const STORAGE_VERSION = '1.0';

interface StoredSettingsData {
  version: string;
  settings: AppSettings;
  lastUpdated: string;
}

/**
 * Settings Persistence Service
 * Handles saving/loading application settings from localStorage
 */
export class SettingsPersistenceService {
  private static instance: SettingsPersistenceService;

  static getInstance(): SettingsPersistenceService {
    if (!SettingsPersistenceService.instance) {
      SettingsPersistenceService.instance = new SettingsPersistenceService();
    }
    return SettingsPersistenceService.instance;
  }

  /**
   * Save settings to localStorage
   */
  saveSettings(settings: AppSettings): void {
    try {
      const data: StoredSettingsData = {
        version: STORAGE_VERSION,
        settings,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  }

  /**
   * Load settings from localStorage
   */
  loadSettings(): AppSettings | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const data: StoredSettingsData = JSON.parse(stored);
      
      // Check version compatibility
      if (data.version !== STORAGE_VERSION) {
        console.warn('Settings storage version mismatch, clearing stored settings');
        this.clearSettings();
        return null;
      }

      return data.settings;
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error);
      return null;
    }
  }

  /**
   * Clear all stored settings
   */
  clearSettings(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear stored settings:', error);
    }
  }

  /**
   * Get the last update timestamp
   */
  getLastUpdateTime(): Date | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const data: StoredSettingsData = JSON.parse(stored);
      return new Date(data.lastUpdated);
    } catch (error) {
      console.error('Failed to get last update time:', error);
      return null;
    }
  }

  /**
   * Check if settings exist in localStorage
   */
  hasStoredSettings(): boolean {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored !== null;
    } catch (error) {
      console.error('Failed to check for stored settings:', error);
      return false;
    }
  }
}

// Export singleton instance
export const settingsPersistence = SettingsPersistenceService.getInstance(); 