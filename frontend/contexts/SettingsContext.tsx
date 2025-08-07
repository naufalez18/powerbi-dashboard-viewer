import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { StorageManager } from '../utils/storage';

export interface AppSettings {
  rotationInterval: number; // in seconds
}

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

interface SettingsProviderProps {
  children: ReactNode;
}

const defaultSettings: AppSettings = {
  rotationInterval: 60, // 1 minute
};

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = StorageManager.getSettings();
      if (savedSettings) {
        setSettings({ ...defaultSettings, ...savedSettings });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Use default settings if there's an error
      setSettings(defaultSettings);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      StorageManager.saveSettings(settings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, [settings]);

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
