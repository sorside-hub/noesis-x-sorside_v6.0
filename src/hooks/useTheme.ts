import { useState, useEffect } from 'react';
import { db } from '../lib/db';

export type ThemeMode = 'sophisticated-dark' | 'editorial-light' | 'warm-parchment';
const STORAGE_KEY_THEME = 'noesis_theme_mode';

export const useTheme = () => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      if (saved === 'editorial-light' || saved === 'sophisticated-dark' || saved === 'warm-parchment') {
        return saved as ThemeMode;
      }
    } catch (e) {}
    return 'sophisticated-dark';
  });

  // Sync with Dexie on mount
  useEffect(() => {
    db.settings.get(STORAGE_KEY_THEME).then((setting) => {
      if (setting && (setting.value === 'sophisticated-dark' || setting.value === 'editorial-light' || setting.value === 'warm-parchment')) {
        setThemeState(setting.value as ThemeMode);
        try {
          localStorage.setItem(STORAGE_KEY_THEME, setting.value);
        } catch (e) {}
      }
    });
  }, []);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY_THEME, newTheme);
    } catch (e) {}
    db.settings.put({ key: STORAGE_KEY_THEME, value: newTheme });
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    
    if (theme === 'editorial-light') {
      root.classList.add('light');
      root.setAttribute('data-theme', 'editorial-light');
    } else if (theme === 'warm-parchment') {
      root.classList.add('light');
      root.setAttribute('data-theme', 'warm-parchment');
    } else {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'sophisticated-dark');
    }
  }, [theme]);

  return { theme, setTheme };
};


