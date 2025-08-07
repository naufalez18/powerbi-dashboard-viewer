import { Dashboard } from '../contexts/DashboardContext';
import { AppSettings } from '../contexts/SettingsContext';

// Storage schema version for migration handling
const CURRENT_SCHEMA_VERSION = 1;

interface StorageSchema {
  version: number;
  dashboards: Dashboard[];
  settings: AppSettings;
  lastUpdated: string;
}

interface LegacyDashboardStorage {
  // Legacy format (pre-versioning)
  dashboards?: Dashboard[];
}

export class StorageManager {
  private static readonly STORAGE_KEY = 'powerbi-dashboard-app';
  private static readonly LEGACY_DASHBOARDS_KEY = 'powerbi-dashboards';

  /**
   * Get the current storage data with migration support
   */
  private static getStorageData(): StorageSchema | null {
    try {
      // First, try to get the new versioned format
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data) as StorageSchema;
        return this.migrateIfNeeded(parsed);
      }

      // If no new format, check for legacy data
      const legacyData = localStorage.getItem(this.LEGACY_DASHBOARDS_KEY);
      if (legacyData) {
        const legacyDashboards = JSON.parse(legacyData) as Dashboard[];
        return this.migrateLegacyData(legacyDashboards);
      }

      return null;
    } catch (error) {
      console.error('Error reading storage data:', error);
      this.handleCorruptedData();
      return null;
    }
  }

  /**
   * Save storage data in the current schema format
   */
  private static saveStorageData(data: Partial<StorageSchema>): void {
    try {
      // Get current data without triggering migration to avoid recursion
      const currentDataRaw = localStorage.getItem(this.STORAGE_KEY);
      let currentData: StorageSchema;
      
      if (currentDataRaw) {
        try {
          currentData = JSON.parse(currentDataRaw) as StorageSchema;
        } catch {
          currentData = {
            version: CURRENT_SCHEMA_VERSION,
            dashboards: [],
            settings: { rotationInterval: 60 },
            lastUpdated: new Date().toISOString(),
          };
        }
      } else {
        currentData = {
          version: CURRENT_SCHEMA_VERSION,
          dashboards: [],
          settings: { rotationInterval: 60 },
          lastUpdated: new Date().toISOString(),
        };
      }

      const updatedData: StorageSchema = {
        ...currentData,
        ...data,
        version: CURRENT_SCHEMA_VERSION,
        lastUpdated: new Date().toISOString(),
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedData));
    } catch (error) {
      console.error('Error saving storage data:', error);
      throw new Error('Failed to save data to localStorage');
    }
  }

  /**
   * Migrate data if the schema version is outdated
   */
  private static migrateIfNeeded(data: StorageSchema): StorageSchema {
    if (data.version === CURRENT_SCHEMA_VERSION) {
      return data;
    }

    console.log(`Migrating storage from version ${data.version} to ${CURRENT_SCHEMA_VERSION}`);

    // Add migration logic here for future schema changes
    switch (data.version) {
      case 0:
      case undefined:
        // Migrate from version 0 (or undefined) to version 1
        const migratedData = {
          version: CURRENT_SCHEMA_VERSION,
          dashboards: data.dashboards || [],
          settings: data.settings || { rotationInterval: 60 },
          lastUpdated: new Date().toISOString(),
        };
        
        // Save migrated data directly to avoid recursion
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(migratedData));
        } catch (error) {
          console.error('Error saving migrated data:', error);
        }
        
        return migratedData;
      default:
        console.warn(`Unknown schema version: ${data.version}, using current data as-is`);
        const updatedData = {
          ...data,
          version: CURRENT_SCHEMA_VERSION,
          lastUpdated: new Date().toISOString(),
        };
        
        // Save updated data directly to avoid recursion
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedData));
        } catch (error) {
          console.error('Error saving updated data:', error);
        }
        
        return updatedData;
    }
  }

  /**
   * Migrate legacy dashboard data to the new schema
   */
  private static migrateLegacyData(legacyDashboards: Dashboard[]): StorageSchema {
    console.log('Migrating legacy dashboard data to new schema');
    
    const migratedData: StorageSchema = {
      version: CURRENT_SCHEMA_VERSION,
      dashboards: legacyDashboards,
      settings: { rotationInterval: 60 },
      lastUpdated: new Date().toISOString(),
    };

    // Save the migrated data directly and remove legacy key
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(migratedData));
      localStorage.removeItem(this.LEGACY_DASHBOARDS_KEY);
    } catch (error) {
      console.error('Error saving migrated legacy data:', error);
    }

    return migratedData;
  }

  /**
   * Handle corrupted localStorage data
   */
  private static handleCorruptedData(): void {
    console.warn('Corrupted localStorage data detected, clearing storage');
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.LEGACY_DASHBOARDS_KEY);
    } catch (error) {
      console.error('Error clearing corrupted data:', error);
    }
  }

  /**
   * Get dashboards from storage
   */
  static getDashboards(): Dashboard[] {
    const data = this.getStorageData();
    return data?.dashboards || [];
  }

  /**
   * Save dashboards to storage
   */
  static saveDashboards(dashboards: Dashboard[]): void {
    this.saveStorageData({ dashboards });
  }

  /**
   * Get settings from storage
   */
  static getSettings(): AppSettings | null {
    const data = this.getStorageData();
    return data?.settings || null;
  }

  /**
   * Save settings to storage
   */
  static saveSettings(settings: AppSettings): void {
    this.saveStorageData({ settings });
  }

  /**
   * Clear all storage data
   */
  static clearAll(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.LEGACY_DASHBOARDS_KEY);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  /**
   * Export all data for backup
   */
  static exportData(): string {
    const data = this.getStorageData();
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import data from backup
   */
  static importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData) as StorageSchema;
      const migratedData = this.migrateIfNeeded(data);
      // Use direct localStorage write to avoid recursion
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(migratedData));
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  /**
   * Get storage usage information
   */
  static getStorageInfo(): { used: number; available: number; percentage: number } {
    try {
      const data = this.getStorageData();
      const dataSize = data ? JSON.stringify(data).length : 0;
      
      // Estimate localStorage limit (usually 5-10MB, we'll use 5MB as conservative estimate)
      const estimatedLimit = 5 * 1024 * 1024; // 5MB in bytes
      
      return {
        used: dataSize,
        available: estimatedLimit - dataSize,
        percentage: (dataSize / estimatedLimit) * 100,
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { used: 0, available: 0, percentage: 0 };
    }
  }
}
